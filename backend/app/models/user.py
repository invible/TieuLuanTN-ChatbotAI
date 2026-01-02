from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship
from app.db import Base

class User(Base):
    __tablename__ = "users" # bảng nhân viên

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(40), unique=True, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(10), nullable=False)
    address = Column(String(255), nullable=False)
    phone = Column(String(15), nullable=False)

    email = Column(String(50), unique=True, nullable=False)
    password = Column(String(100), nullable=False)
    role = Column(String(40), nullable=False)
    status = Column(String(40), default="active")
    # password_hash = Column(String(255), nullable=False)
    # created_at = Column(DateTime, default=datetime.utcnow)

    # relationships
    orders = relationship("Order", back_populates="users")
    receipts = relationship("Receipt", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")