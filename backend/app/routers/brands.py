from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app import models, schemas

router = APIRouter(prefix="/brands", tags=["Brands"])

@router.get("/", response_model=List[schemas.BrandOut])
def list_brands(db: Session = Depends(get_db)):
    return db.query(models.Brand).all()

@router.post("/", response_model=schemas.BrandOut)
def create_brand(br: schemas.BrandCreate, db: Session = Depends(get_db)):
    obj = models.Brand(**br.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{br_id}", response_model=schemas.BrandOut)
def update_brand(br_id: str, br: schemas.BrandUpdate, db: Session = Depends(get_db)):
    obj = db.query(models.Brand).filter(models.Brand.id == br_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Thương hiệu không tồn tại")
    for field, value in br.dict(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{br_id}")
def delete_brand(br_id: str, db: Session = Depends(get_db)):
    obj = db.query(models.Brand).filter(models.Brand.id == br_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Thương hiệu không tồn tại")
    db.delete(obj)
    db.commit()
    return {"success": True}
