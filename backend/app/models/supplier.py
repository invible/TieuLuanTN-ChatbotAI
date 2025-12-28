from sqlalchemy import Column, String, Date, Integer
from sqlalchemy.orm import relationship
from app.db import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(40), nullable=False)
    representative = Column(String(40), nullable=False)

    # relationships
    receipts = relationship("Receipt", back_populates="suppliers")
