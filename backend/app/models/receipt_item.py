from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from app.db import Base

class ReceiptItem(Base):
    __tablename__ = "receipt_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10), nullable=False)

    receipt_id = Column(Integer, ForeignKey("receipts.id"))
    product_id = Column(Integer, ForeignKey("products.id"))

    # relationships
    receipt = relationship("Receipt", back_populates="receipt_items")
    products = relationship("Product", back_populates="receipt_items")