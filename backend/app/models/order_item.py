from sqlalchemy import Column, String, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db import Base

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 0), nullable=False)
    discount = Column(Numeric(12, 0), default=0)

    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))

    # relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")