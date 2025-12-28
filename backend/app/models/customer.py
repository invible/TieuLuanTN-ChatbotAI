from sqlalchemy import Column, String, Date, Integer
from sqlalchemy.orm import relationship
from app.db import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(40), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(10), nullable=False)
    address = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)

    # relationships
    orders = relationship("Order", back_populates="customers")
