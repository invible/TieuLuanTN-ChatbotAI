import pymysql
import os
from app.chatbot.vanna_client import MyVanna  # Đảm bảo đường dẫn import đúng
from app.chatbot.config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

def get_all_table_ddl():
    """Kết nối DB và lấy câu lệnh CREATE TABLE của từng bảng"""
    connection = pymysql.connect(
        host=DB_HOST,
        port=int(DB_PORT),
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    
    tables_ddl = []
    try:
        with connection.cursor() as cursor:
            # 1. Lấy danh sách tất cả các bảng trong database
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            for table_dict in tables:
                table_name = list(table_dict.values())[0]
                
                # Bỏ qua các bảng không cần thiết (ví dụ bảng log, bảng tạm)
                if table_name.lower() in ['migrations', 'failed_jobs', 'personal_access_tokens']:
                    continue
                
                # 2. Lấy câu lệnh CREATE TABLE thực tế
                cursor.execute(f"SHOW CREATE TABLE {table_name}")
                result = cursor.fetchone()
                ddl = result['Create Table']
                
                # Tối ưu DDL: Xóa bớt các phần thừa như AUTO_INCREMENT để LLM đỡ rối
                import re
                ddl = re.sub(r'AUTO_INCREMENT=\d+\s+', '', ddl)
                
                tables_ddl.append(ddl)
                print(f"📌 Đã quét xong bảng: {table_name}")
                
    finally:
        connection.close()
    return tables_ddl

def run_retrain():
    # 1. Khởi tạo Vanna
    vn = MyVanna()
    
    print("🧹 Đang tiến hành reset dữ liệu cũ...")
    # Xóa sạch dữ liệu cũ trong Vector Store (ChromaDB)
    # Cách nhanh nhất là bạn xóa tay thư mục VECTOR_DIR trước khi chạy script này
    
    # 2. Quét DDL từ Database thực tế
    all_ddl = get_all_table_ddl()
    
    print(f"🚀 Bắt đầu train {len(all_ddl)} bảng vào Vector Store...")
    for ddl in all_ddl:
        vn.train(ddl=ddl)
    
    # 3. Train thêm câu hỏi mẫu (Q&A) - Đây là phần giúp LLM chọn đúng cột
    # Bạn nên liệt kê các câu hỏi phổ biến và SQL chuẩn (chỉ lấy cột cần thiết)
    print("📝 Training câu hỏi mẫu chuẩn...")
    qa_samples = [
        # {
        #     "q": "Danh sách 5 sản phẩm bán chạy nhất là gì?",
        #     "sql": "SELECT name, selling_price, stock FROM products ORDER BY stock DESC LIMIT 5"
        # },
        # {
        #     "q": "Doanh thu tháng này là bao nhiêu?",
        #     "sql": "SELECT SUM(total_amount) as total_revenue FROM orders WHERE MONTH(created_at) = MONTH(CURRENT_DATE())"
        # },
        {
            "q": "Doanh số (tổng doanh thu) tháng này là bao nhiêu?",
            "sql": "SELECT SUM(total_amount) AS revenue_this_month FROM orders WHERE status = 'completed'   AND YEAR(order_date) = YEAR(CURDATE())   AND MONTH(order_date) = MONTH(CURDATE());"
        },
        {
            "q": "Doanh thu năm 2024 là bao nhiêu?",
            "sql": "SELECT SUM(total_amount) AS revenue_2024 FROM orders WHERE status = 'completed'   AND YEAR(order_date) = 2024;"
        },
        {
            "q": "Doanh thu theo từng tháng trong năm 2024 (12 dòng)",
            "sql": "SELECT YEAR(order_date) AS year,        MONTH(order_date) AS month,        SUM(total_amount) AS revenue FROM orders WHERE status = 'completed'   AND YEAR(order_date) = 2024 GROUP BY YEAR(order_date), MONTH(order_date) ORDER BY year, month;"
        },
        {
            "q": "Số lượng đơn hàng tháng này là bao nhiêu?",
            "sql": "SELECT COUNT(*) AS total_orders_this_month FROM orders WHERE YEAR(order_date) = YEAR(CURDATE())   AND MONTH(order_date) = MONTH(CURDATE());"
        },
        {
            "q": "Giá trị đơn hàng trung bình (AOV) trong tháng này là bao nhiêu?",
            "sql": "SELECT AVG(total_amount) AS avg_order_value_this_month FROM orders WHERE status = 'completed'   AND YEAR(order_date) = YEAR(CURDATE())   AND MONTH(order_date) = MONTH(CURDATE());"
        },
        {
            "q": "Top 5 sản phẩm bán chạy nhất (theo số lượng) là gì?",
            "sql": "SELECT p.id, p.name,        SUM(oi.quantity) AS total_sold FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id WHERE o.status = 'completed' GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 5;"
        },
        {
            "q": "Top 5 sản phẩm mang lại doanh thu cao nhất là gì?",
            "sql": "SELECT p.id, p.name,        SUM(oi.quantity * (oi.unit_price - oi.discount)) AS revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id WHERE o.status = 'completed' GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 5;"
        },
        {
            "q": "Top 5 khách hàng chi tiêu cao nhất trong năm 2024 là ai?",
            "sql": "SELECT c.id, c.name,        SUM(o.total_amount) AS total_spent FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.status = 'completed'   AND YEAR(o.order_date) = 2024 GROUP BY c.id, c.name ORDER BY total_spent DESC LIMIT 5;"
        },
        {
            "q": "Khách hàng nào mua nhiều đơn nhất trong năm 2024?",
            "sql": "SELECT c.id, c.name,        COUNT(o.id) AS total_orders FROM orders o JOIN customers c ON c.id = o.customer_id WHERE YEAR(o.order_date) = 2024 GROUP BY c.id, c.name ORDER BY total_orders DESC LIMIT 1;"
        },
        {
            "q": "Nhân viên (user) nào có doanh số cao nhất trong năm 2024?",
            "sql": "SELECT u.id, u.username,        SUM(o.total_amount) AS revenue FROM orders o JOIN users u ON u.id = o.user_id WHERE o.status = 'completed'   AND YEAR(o.order_date) = 2024 GROUP BY u.id, u.username ORDER BY revenue DESC LIMIT 1;"
        },
        {
            "q": "Top 5 nhân viên (user) có doanh thu cao nhất trong năm 2024",
            "sql": "SELECT u.id, u.username,        SUM(o.total_amount) AS revenue FROM orders o JOIN users u ON u.id = o.user_id WHERE o.status = 'completed'   AND YEAR(o.order_date) = 2024 GROUP BY u.id, u.username ORDER BY revenue DESC LIMIT 5;"
        },
        {
            "q": "Doanh thu theo phương thức thanh toán trong năm 2024",
            "sql": "SELECT payment_method,        SUM(total_amount) AS revenue FROM orders WHERE status = 'completed'   AND YEAR(order_date) = 2024 GROUP BY payment_method ORDER BY revenue DESC;"
        },
        {
            "q": "Doanh thu theo từng danh mục sản phẩm trong năm 2024",
            "sql": "SELECT c.id AS category_id, c.name AS category_name,        SUM(oi.quantity * (oi.unit_price - oi.discount)) AS revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id WHERE o.status = 'completed'   AND YEAR(o.order_date) = 2024 GROUP BY c.id, c.name ORDER BY revenue DESC;"
        },
        {
            "q": "Doanh thu theo từng thương hiệu trong năm 2024",
            "sql": "SELECT b.id AS brand_id, b.name AS brand_name,        SUM(oi.quantity * (oi.unit_price - oi.discount)) AS revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id JOIN brands b ON b.id = p.brand_id WHERE o.status = 'completed'   AND YEAR(o.order_date) = 2024 GROUP BY b.id, b.name ORDER BY revenue DESC;"
        },
        {
            "q": "Trong tháng này, mỗi ngày doanh thu là bao nhiêu?",
            "sql": "SELECT DATE(order_date) AS day,        SUM(total_amount) AS revenue FROM orders WHERE status = 'completed'   AND YEAR(order_date) = YEAR(CURDATE())   AND MONTH(order_date) = MONTH(CURDATE()) GROUP BY DATE(order_date) ORDER BY day;"
        },
        {
            "q": "Ngày nào có doanh thu cao nhất trong năm 2024?",
            "sql": "SELECT DATE(order_date) AS day,        SUM(total_amount) AS revenue FROM orders WHERE status = 'completed'   AND YEAR(order_date) = 2024 GROUP BY DATE(order_date) ORDER BY revenue DESC LIMIT 1;"
        },
        {
            "q": "Top 10 đơn hàng có giá trị lớn nhất trong năm 2024",
            "sql": "SELECT id, order_date, total_amount, payment_method, status, user_id, customer_id FROM orders WHERE YEAR(order_date) = 2024 ORDER BY total_amount DESC LIMIT 10;"
        },
        {
            "q": "Sản phẩm nào đang tồn kho thấp nhất (top 10) để cảnh báo?",
            "sql": "SELECT id, name, stock FROM products ORDER BY stock ASC LIMIT 10;"
        },
        {
            "q": "Tổng số lượng hàng nhập kho theo từng sản phẩm trong năm 2024",
            "sql": "SELECT p.id, p.name,        SUM(ri.quantity) AS total_imported FROM receipt_items ri JOIN receipts r ON r.id = ri.receipt_id JOIN products p ON p.id = ri.product_id WHERE r.status = 'completed'   AND YEAR(r.create_date) = 2024 GROUP BY p.id, p.name ORDER BY total_imported DESC;"
        },
        {
            "q": "Nhà cung cấp nào cung cấp nhiều giá trị nhập kho nhất trong năm 2024?",
            "sql": "SELECT s.id, s.name,        SUM(ri.quantity * ri.unit_price) AS import_value FROM receipt_items ri JOIN receipts r ON r.id = ri.receipt_id JOIN suppliers s ON s.id = r.supplier_id WHERE r.status = 'completed'   AND YEAR(r.create_date) = 2024 GROUP BY s.id, s.name ORDER BY import_value DESC LIMIT 1;"
        }
    ]
    
    for item in qa_samples:
        vn.train(question=item['q'], sql=item['sql'])

    print("✨ Hoàn tất! Hệ thống đã được train lại với dữ liệu chuẩn.")

if __name__ == "__main__":
    run_retrain()