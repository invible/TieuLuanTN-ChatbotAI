from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.utils.auth import get_password_hash

from app.db import get_db
from app import models, schemas

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Người dùng không tồn tại")
    return user


@router.post("/", response_model=schemas.UserOut)
def create_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Hash password để lưu vào database
    password_hash = get_password_hash(user_in.password)

    user = models.User(
        username=user_in.username,
        date_of_birth=user_in.date_of_birth,
        gender=user_in.gender,
        address=user_in.address,
        phone=user_in.phone,
        email=user_in.email,
        password=password_hash,
        role=user_in.role,
        status=user_in.status or "active",
    )

    # kiểm tra trùng email
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(400, "Email đã được sử dụng")

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, user_in: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Người dùng không tồn tại")

    data = user_in.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Người dùng không tồn tại")

    db.delete(user)
    db.commit()
    return {"success": True}
