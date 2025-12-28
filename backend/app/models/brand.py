from sqlalchemy import Column, String, Integer, Text
from sqlalchemy.orm import relationship
from app.db import Base

class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(40), unique=True, nullable=False)
    origin = Column(Text, nullable=False)

    products = relationship("Product", back_populates="brand")
