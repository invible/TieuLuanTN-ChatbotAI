import pymysql
from .config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

# Kết nối MySQL
def get_mysql_connection():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )
