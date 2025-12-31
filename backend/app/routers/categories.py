from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.db import get_db
from app import models, schemas

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=List[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


@router.post("/", response_model=schemas.CategoryOut)
def create_category(cat: schemas.CategoryCreate, db: Session = Depends(get_db)):
    obj = models.Category(**cat.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{cat_id}", response_model=schemas.CategoryOut)
def get_category(cat_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not obj:
        raise HTTPException(404, "Danh mục không tồn tại")
    return obj


@router.put("/{cat_id}", response_model=schemas.CategoryOut)
def update_category(cat_id: int, cat_in: schemas.CategoryUpdate, db: Session = Depends(get_db)):
    obj = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not obj:
        raise HTTPException(404, "Danh mục không tồn tại")
    
    update_data = cat_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(obj, key, value)

    # 3. QUAN TRỌNG: Phải có commit để lưu vào ổ cứng
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not obj:
        raise HTTPException(404, "Danh mục không tồn tại")
    db.delete(obj)
    db.commit()
    return {"success": True}
