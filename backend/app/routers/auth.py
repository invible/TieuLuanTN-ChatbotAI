from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app import models, schemas

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=schemas.LoginResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(models.User)
        .filter(
            models.User.email == data.email,
            models.User.password == data.password,  # TODO: hash
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    # có thể trả về info cơ bản, chưa cần JWT
    return schemas.LoginResponse(
        id=user.id,
        ten_user=user.username,
        email=user.email,
        role=user.role,
        token=None, # cập nhật nếu dùng JWT
    )
