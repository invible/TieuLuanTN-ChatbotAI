from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    session_id = Column(Text, nullable=False)
    status = Column(String(40), default="active")

    user_id = Column(Integer, ForeignKey("users.id"))

    # relationships
    user = relationship("User", back_populates="chat_sessions")
    chat_messages = relationship("ChatMessage", back_populates="chat_session")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    send_time = Column(DateTime, nullable=False)
    send_name = Column(String(40), nullable=True)
    question = Column(Text, nullable=False)
    sql_generate = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))

    # relationships
    user = relationship("User", back_populates="chat_messages")
    chat_session = relationship("ChatSession", back_populates="chat_messages")