# Cấu hình kết nối
import os
from dotenv import load_dotenv

load_dotenv()

# Kết nối MySQL
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT"))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# Thư mục lưu trữ vector
VECTOR_DIR = os.getenv("VECTOR_DIR")

# Cấu hình Ollama
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")

# Danh sách bảng để huấn luyện (mặc định lấy từ biến môi trường TABLES) 
TABLES = [
    t.strip()
    for t in os.getenv("TABLES","users,products,orders,order_items").split(",")
    if t.strip()
]
# Cấu hình Vanna Cloud
VANNA_API_KEY = os.getenv("VANNA_API_KEY")
VANNA_MODEL = os.getenv("VANNA_MODEL")
