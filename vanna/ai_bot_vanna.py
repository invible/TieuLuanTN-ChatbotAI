import streamlit as st
import vanna
from vanna.remote import VannaDefault
import pandas as pd
import plotly.express as px

# Cấu hình page
st.set_page_config(
    page_title="Vanna AI Demo",
    page_icon="🤖",
    layout="wide"
)

# Khởi tạo Vanna
@st.cache_resource
def init_vanna():
    try:
        vn = VannaDefault(model='chinook', api_key='ed2715408f2a4de28eac1999d8c7221c')
        vn.connect_to_sqlite('https://vanna.ai/Chinook.sqlite')
        
        # Training cơ bản
        training_questions = [
            "Top 5 album bán chạy nhất?",
            "Doanh thu theo quốc gia?",
            "Nghệ sĩ có nhiều bài hát nhất?",
            "Thống kê số lượng khách hàng theo quốc gia"
        ]
        
        return vn
    except Exception as e:
        st.error(f"Lỗi khởi tạo Vanna: {e}")
        return None

vn = init_vanna()

# Header
st.title("🤖 Vanna AI Demo")
st.markdown("Hỏi câu hỏi về database Chinook và nhận câu trả lời!")

# Sidebar
with st.sidebar:
    st.header("Thông tin")
    st.info("Database: Chinook SQLite")
    st.info("Model: Vanna Default")
    
    st.header("Kiểm tra kết nối")
    if st.button("Test Connection"):
        try:
            tables = vn.run_sql("SELECT name FROM sqlite_master WHERE type='table';")
            st.success(f"✅ Kết nối thành công! Có {len(tables)} tables.")
            st.dataframe(tables)
        except Exception as e:
            st.error(f"❌ Lỗi kết nối: {e}")

# Main content
col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("Hỏi câu hỏi")
    question = st.text_input(
        "Nhập câu hỏi của bạn:",
        placeholder="Ví dụ: Top 5 album bán chạy nhất?"
    )
    
    if st.button("Tìm câu trả lời") and question:
        if vn is None:
            st.error("Vanna chưa được khởi tạo đúng cách!")
        else:
            with st.spinner("Đang xử lý..."):
                try:
                    # Generate SQL
                    sql = vn.generate_sql(question=question)
                    
                    # Run query
                    df = vn.run_sql(sql)
                    
                    # Display results
                    st.subheader("Kết quả")
                    if not df.empty:
                        st.dataframe(df, use_container_width=True)
                        
                        # Tạo biểu đồ đơn giản
                        if len(df) > 1 and len(df.columns) >= 2:
                            try:
                                # Thử tạo biểu đồ cột cho 2 cột đầu tiên
                                if pd.api.types.is_numeric_dtype(df.iloc[:, 1]):
                                    fig = px.bar(df, x=df.columns[0], y=df.columns[1], 
                                                title=f"Biểu đồ {question}")
                                    st.plotly_chart(fig, use_container_width=True)
                            except Exception as chart_error:
                                st.info("Không thể tạo biểu đồ tự động cho dữ liệu này")
                    else:
                        st.warning("Không có dữ liệu trả về")
                    
                    # Display SQL
                    with st.expander("Xem SQL query"):
                        st.code(sql, language="sql")
                        
                except Exception as e:
                    st.error(f"Lỗi: {e}")
                    st.info("💡 Thử hỏi câu hỏi khác hoặc kiểm tra cấu hình")

with col2:
    st.subheader("Câu hỏi mẫu")
    sample_questions = [
        "Top 5 album bán chạy nhất?",
        "Doanh thu theo quốc gia?",
        "Nghệ sĩ có nhiều bài hát nhất?",
        "Thống kê số lượng khách hàng theo quốc gia",
        "Bài hát dài nhất của mỗi nghệ sĩ?",
        "Doanh thu theo năm?"
    ]
    
    for q in sample_questions:
        if st.button(q, key=q):
            # Set question to input
            st.session_state.question_input = q
    
    # Xử lý khi chọn câu hỏi mẫu
    if 'question_input' in st.session_state:
        question = st.session_state.question_input
        # Tự động trigger tìm kiếm
        if vn is not None:
            with st.spinner("Đang xử lý..."):
                try:
                    sql = vn.generate_sql(question=question)
                    df = vn.run_sql(sql)
                    
                    st.subheader("Kết quả")
                    if not df.empty:
                        st.dataframe(df, use_container_width=True)
                        
                        # Display SQL
                        with st.expander("Xem SQL query"):
                            st.code(sql, language="sql")
                    else:
                        st.warning("Không có dữ liệu trả về")
                        
                except Exception as e:
                    st.error(f"Lỗi: {e}")

# Footer
st.markdown("---")
st.markdown("**Vanna AI Demo** - Sử dụng Chinook SQLite Database")