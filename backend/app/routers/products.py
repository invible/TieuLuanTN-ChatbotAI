import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app import models, schemas

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=List[schemas.ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Sản phẩm không tồn tại")
    return product


@router.post("/", response_model=schemas.ProductOut)
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db)):
    product = models.Product(**product_in.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    product_in: schemas.ProductUpdate,
    db: Session = Depends(get_db),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Sản phẩm không tồn tại")

    data = product_in.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Sản phẩm không tồn tại")

    db.delete(product)
    db.commit()
    return {"success": True}

# thư mục lưu ảnh sản phẩm
BASE_DIR = Path(__file__).resolve().parent.parent   # routers/ -> app/
STATIC_DIR = BASE_DIR / "static"
UPLOAD_DIR = STATIC_DIR / "uploads" / "products"
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}

@router.post("/upload-image")
async def upload_product_image(
    request: Request,
    file: UploadFile = File(...),
):
    # 1) validate extension
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"Chỉ hỗ trợ: {', '.join(sorted(ALLOWED_EXT))}")

    # 2) tạo folder nếu chưa có
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 3) tạo tên file unique
    filename = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_DIR, filename)

    # 4) lưu file
    content = await file.read()
    if not content:
        raise HTTPException(400, "File rỗng")

    with open(save_path, "wb") as f:
        f.write(content)

    # 5) trả về URL public
    #    URL sẽ là /static/uploads/products/<filename>
    url = f"/static/uploads/products/{filename}"

    return {"url": url, "filename": filename}