from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_date = Column(DateTime, nullable=False)
    total_amount = Column(Numeric(10), nullable=False)
    note = Column(String(100), nullable=True)
    payment_method = Column(String(40), nullable=False)
    status = Column(String(40), default="completed")
    # created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))

    # relationships
    users = relationship("User", back_populates="orders")
    customers = relationship("Customer", back_populates="orders")
    order_items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )