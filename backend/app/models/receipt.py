from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db import Base

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    create_date = Column(DateTime, nullable=False)
    approval_date = Column(DateTime, nullable=True)
    approval_person = Column(String(40), nullable=True)
    note = Column(String(100), nullable=True)
    status = Column(String(40), default="completed")

    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    # relationships
    user = relationship("User", back_populates="receipts")
    suppliers = relationship("Supplier", back_populates="receipts")
    receipt_items = relationship(
        "ReceiptItem",
        back_populates="receipt",
        cascade="all, delete-orphan",
    )