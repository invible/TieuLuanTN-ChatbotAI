from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app import models, schemas

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("/", response_model=List[schemas.SupplierOut])
def list_suppliers(db: Session = Depends(get_db)):
    suppliers = db.query(models.Supplier).order_by(models.Supplier.id.desc()).all()
    return suppliers