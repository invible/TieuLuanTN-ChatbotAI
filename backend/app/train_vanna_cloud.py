import vanna
from vanna.remote import VannaDefault
import os

# 1. Khởi tạo kết nối với VannaCloud
vn = VannaDefault(model='chatbot_vanna', api_key='ed2715408f2a4de28eac1999d8c7221c')

# 2. Danh sách 25 cặp Q&A (Rút gọn để bạn dễ hình dung, hãy copy đầy đủ 25 câu vào đây)
training_data = [
    {
        "question": "Doanh thu của cửa hàng theo từng tháng trong năm nay?",
        "sql": "SELECT MONTH(order_date) AS month, SUM(total_amount) AS revenue FROM orders WHERE YEAR(order_date) = YEAR(CURRENT_DATE()) GROUP BY month ORDER BY month;"
    },

    # 2. Doanh thu theo danh mục sản phẩm
    {
        "question": "Doanh thu theo từng danh mục sản phẩm là bao nhiêu?",
        "sql": "SELECT c.name, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN categories c ON p.category_id = c.id GROUP BY c.name ORDER BY revenue DESC;"
    },

    # 3. Số đơn hàng bán ra trong tháng này
    {
        "question": "Tháng này có bao nhiêu đơn hàng đã bán?",
        "sql": "SELECT COUNT(*) AS total_orders FROM orders WHERE MONTH(order_date) = MONTH(CURRENT_DATE()) AND YEAR(order_date) = YEAR(CURRENT_DATE());"
    },

    # 4. Top 5 sản phẩm bán chạy nhất theo số lượng
    {
        "question": "Top 5 sản phẩm bán chạy nhất theo số lượng?",
        "sql": "SELECT p.name, SUM(oi.quantity) AS total_qty FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.name ORDER BY total_qty DESC LIMIT 5;"
    },

    # 5. Các sản phẩm sắp hết hàng (tồn kho < 10)
    {
        "question": "Những sản phẩm nào sắp hết hàng (tồn kho dưới 10)?",
        "sql": "SELECT name, stock FROM products WHERE stock < 10 ORDER BY stock ASC;"
    },

    # 6. Sản phẩm không có đơn hàng trong 30 ngày qua
    {
        "question": "Các sản phẩm không có đơn hàng nào trong 30 ngày gần đây?",
        "sql": "SELECT id, name FROM products WHERE id NOT IN (SELECT DISTINCT product_id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY));"
    },

    # 7. Giá trị đơn hàng trung bình (AOV) trong 30 ngày qua
    {
        "question": "Giá trị trung bình đơn hàng trong 30 ngày gần đây là bao nhiêu?",
        "sql": "SELECT AVG(total_amount) AS avg_order_value FROM orders WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY);"
    },

    # 8. Số lượng khách hàng mới trong tháng này
    {
        "question": "Có bao nhiêu khách hàng mới trong tháng này?",
        "sql": "SELECT COUNT(*) AS new_customers FROM customers WHERE id IN (SELECT customer_id FROM orders GROUP BY customer_id HAVING MIN(DATE(order_date)) >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'));"
    },

    # 9. Top 5 khách hàng chi tiêu nhiều nhất
    {
        "question": "Top 5 khách hàng có chi tiêu nhiều nhất là ai?",
        "sql": "SELECT cu.name, SUM(o.total_amount) AS total_spent FROM orders o JOIN customers cu ON o.customer_id = cu.id GROUP BY cu.name ORDER BY total_spent DESC LIMIT 5;"
    },

    # 10. Tổng giá trị hàng nhập trong tháng này
    {
        "question": "Tổng giá trị hàng đã nhập trong tháng này là bao nhiêu?",
        "sql": "SELECT SUM(ri.quantity * ri.unit_price) AS total_import_value FROM receipt_items ri JOIN receipts r ON ri.receipt_id = r.id WHERE MONTH(r.create_date) = MONTH(CURRENT_DATE()) AND YEAR(r.create_date) = YEAR(CURRENT_DATE());"
    },

    # 11. Top nhà cung cấp nhập hàng nhiều nhất
    {
        "question": "Top 3 nhà cung cấp mà cửa hàng nhập hàng nhiều nhất theo giá trị?",
        "sql": "SELECT s.name, SUM(ri.quantity * ri.unit_price) AS import_value FROM receipt_items ri JOIN receipts r ON ri.receipt_id = r.id JOIN suppliers s ON r.supplier_id = s.id GROUP BY s.name ORDER BY import_value DESC LIMIT 3;"
    },

    # 12. Phiếu nhập kho có giá trị cao nhất
    {
        "question": "Phiếu nhập kho nào có giá trị cao nhất?",
        "sql": "SELECT r.id, r.create_date, SUM(ri.quantity * ri.unit_price) AS total_value FROM receipts r JOIN receipt_items ri ON r.id = ri.receipt_id GROUP BY r.id, r.create_date ORDER BY total_value DESC LIMIT 1;"
    },

    # 13. Top nhân viên có doanh số cao nhất trong tháng
    {
        "question": "Top nhân viên bán hàng có doanh số cao nhất trong tháng này?",
        "sql": "SELECT u.username, SUM(o.total_amount) AS sales_performance FROM orders o JOIN users u ON o.user_id = u.id WHERE MONTH(o.order_date) = MONTH(CURRENT_DATE()) AND YEAR(o.order_date) = YEAR(CURRENT_DATE()) GROUP BY u.username ORDER BY sales_performance DESC LIMIT 1;"
    },

    # 14. Số lượng sản phẩm tồn kho theo danh mục
    {
        "question": "Tổng số lượng hàng tồn kho theo từng danh mục?",
        "sql": "SELECT c.name, SUM(p.stock) AS total_stock FROM products p JOIN categories c ON p.category_id = c.id GROUP BY c.name;"
    },

    # 15. Tỷ lệ đơn hàng theo phương thức thanh toán
    {
        "question": "Thống kê số lượng đơn hàng theo phương thức thanh toán?",
        "sql": "SELECT payment_method, COUNT(*) AS count FROM orders GROUP BY payment_method ORDER BY count DESC;"
    },

    # 16. Phân tích lợi nhuận theo sản phẩm
    {
        "question": "Sản phẩm nào mang lại lợi nhuận cao nhất (Giá bán - Giá nhập)?",
        "sql": "SELECT name, (selling_price - purchase_price) AS profit_per_unit, stock FROM products ORDER BY profit_per_unit DESC LIMIT 10;"
    },

    # 17. Tổng lợi nhuận thực tế từ các đơn hàng trong tháng này
    {
        "question": "Tổng lợi nhuận thu được trong tháng này là bao nhiêu?",
        "sql": """
        SELECT SUM((oi.unit_price - p.purchase_price) * oi.quantity) AS total_profit
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE MONTH(o.order_date) = MONTH(CURRENT_DATE()) AND YEAR(o.order_date) = YEAR(CURRENT_DATE());
        """
    },

    # 18. Tỷ lệ đóng góp doanh thu của từng thương hiệu (Brand)
    {
        "question": "Doanh số bán hàng theo từng thương hiệu?",
        "sql": """
        SELECT b.name AS brand_name, SUM(oi.quantity * oi.unit_price) AS revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN brands b ON p.brand_id = b.id
        GROUP BY b.name
        ORDER BY revenue DESC;
        """
    },

    # 19. Khách hàng trung thành (Mua hàng nhiều hơn 3 lần)
    {
        "question": "Danh sách khách hàng thân thiết đã mua trên 3 đơn hàng?",
        "sql": """
        SELECT cu.name, cu.phone, COUNT(o.id) AS total_orders
        FROM orders o
        JOIN customers cu ON o.customer_id = cu.id
        GROUP BY cu.id, cu.name, cu.phone
        HAVING total_orders > 3
        ORDER BY total_orders DESC;
        """
    },

    # 20. Phân tích doanh số theo khung giờ trong ngày
    {
        "question": "Khung giờ nào trong ngày thường có nhiều đơn hàng nhất?",
        "sql": """
        SELECT HOUR(order_date) AS order_hour, COUNT(*) AS order_count
        FROM orders
        GROUP BY order_hour
        ORDER BY order_count DESC;
        """
    },

    # 21. Giá trị tồn kho hiện tại (Tính theo giá nhập)
    {
        "question": "Tổng giá trị hàng hóa hiện đang tồn kho theo giá nhập là bao nhiêu?",
        "sql": "SELECT SUM(stock * purchase_price) AS inventory_value FROM products;"
    },

    # 22. Hiệu suất nhập hàng (So sánh giá nhập giữa các nhà cung cấp cho cùng 1 sản phẩm)
    {
        "question": "Lịch sử giá nhập của sản phẩm theo từng nhà cung cấp?",
        "sql": """
        SELECT p.name AS product_name, s.name AS supplier_name, ri.unit_price AS import_price, r.create_date
        FROM receipt_items ri
        JOIN receipts r ON ri.receipt_id = r.id
        JOIN products p ON ri.product_id = p.id
        JOIN suppliers s ON r.supplier_id = s.id
        ORDER BY p.name, r.create_date DESC;
        """
    },

    # 23. Tỷ lệ chuyển đổi đơn hàng theo nhân viên (Users)
    {
        "question": "Nhân viên nào xử lý nhiều đơn hàng nhất trong năm nay?",
        "sql": """
        SELECT u.username, COUNT(o.id) AS processed_orders
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE YEAR(o.order_date) = YEAR(CURRENT_DATE())
        GROUP BY u.id, u.username
        ORDER BY processed_orders DESC;
        """
    },

    # 24. Sản phẩm có tốc độ bán chậm (Tồn kho cao nhưng bán ít)
    {
        "question": "Những sản phẩm nào có tồn kho trên 50 nhưng bán ra dưới 5 cái trong tháng này?",
        "sql": """
        SELECT p.name, p.stock, COALESCE(SUM(oi.quantity), 0) AS sold_qty
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND MONTH(o.order_date) = MONTH(CURRENT_DATE())
        WHERE p.stock > 50
        GROUP BY p.id, p.name, p.stock
        HAVING sold_qty < 5;
        """
    },

    # 25. Doanh thu trung bình mỗi ngày trong tháng hiện tại
    {
        "question": "Doanh thu trung bình mỗi ngày của tháng này là bao nhiêu?",
        "sql": """
        SELECT SUM(total_amount) / DAY(LAST_DAY(CURRENT_DATE())) AS avg_daily_revenue
        FROM orders
        WHERE MONTH(order_date) = MONTH(CURRENT_DATE()) AND YEAR(order_date) = YEAR(CURRENT_DATE());
        """
    }
]

def train_database_structure(file_path):
    """Đọc file .sql và nạp cấu trúc DDL vào Vanna"""
    if not os.path.exists(file_path):
        print(f"❌ Không tìm thấy file: {file_path}")
        return

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Tách các câu lệnh CREATE TABLE để nạp riêng biệt hoặc nạp cả khối
        # VannaCloud khuyến khích nạp DDL để hiểu schema
        vn.train(ddl=sql_content)
        print(f"✅ Đã nạp thành công cấu trúc DDL từ file {file_path}")
    except Exception as e:
        print(f"❌ Lỗi khi nạp DDL: {str(e)}")

def train_qa_pairs():
    """Nạp các cặp câu hỏi và câu lệnh SQL mẫu"""
    print(f"Bắt đầu nạp {len(training_data)} câu hỏi mẫu...")
    success_count = 0
    for i, item in enumerate(training_data):
        try:
            vn.train(question=item['question'], sql=item['sql'])
            success_count += 1
        except Exception as e:
            print(f"❌ Lỗi ở câu '{item['question']}': {str(e)}")
    print(f"✅ Đã nạp thành công {success_count}/{len(training_data)} câu hỏi mẫu.")

if __name__ == "__main__":
    # Bước 1: Nạp cấu trúc bảng (Chỉ cần chạy 1 lần duy nhất hoặc khi bạn thay đổi DB)
    train_database_structure('backend/app/init_tables.sql')
    
    # Bước 2: Nạp dữ liệu câu hỏi mẫu
    train_qa_pairs()
    
    print("\n--- HOÀN TẤT QUÁ TRÌNH HUẤN LUYỆN ---")