import pymysql
from .config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
from sqlalchemy import create_engine

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

def create_engine_local():
    return create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4",
            pool_pre_ping=True,)