from sqlalchemy import Column, Integer, String, DateTime, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    unit = Column(String(40), nullable=False)
    packaging = Column(String(40), nullable=True)
    image_url = Column(String(255), nullable=True)
    purchase_price = Column(Numeric(10), nullable=True)
    selling_price = Column(Numeric(10), nullable=True)
    stock = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    category_id= Column(Integer, ForeignKey("categories.id"))
    brand_id = Column(Integer, ForeignKey("brands.id"))

    # relationships
    # 1 product có nhiều order_items
    order_items = relationship(
        "OrderItem",
        back_populates="product",
        cascade="all, delete-orphan",
    )
    brand = relationship("Brand", back_populates="products")
    category = relationship("Category", back_populates="products")
    receipt_items = relationship(
        "ReceiptItem",
        back_populates="products",
        cascade="all, delete-orphan",
    )