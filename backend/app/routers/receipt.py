from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app import models, schemas

router = APIRouter(prefix="/receipts", tags=["Receipts"])


@router.get("/", response_model=List[schemas.ReceiptOut])
def list_receipts(db: Session = Depends(get_db)):
    receipts = db.query(models.Receipt).order_by(models.Receipt.id.desc()).all()
    return receipts

@router.get("/{receipt_id}", response_model=schemas.ReceiptOut)
def get_receipt(receipt_id: int, db: Session = Depends(get_db)):
    receipt = db.query(models.Receipt).filter(models.Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(404, "Phiếu nhập không tồn tại")
    return receipt

# --- Hàm hỗ trợ cập nhật kho (Helper) ---
def adjust_inventory(db: Session, product_id: int, quantity: int, price: float = None):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product:
        # Cập nhật số lượng tồn kho
        product.stock += quantity 
        # Cập nhật giá nhập mới nhất (nếu có)
        if price is not None:
            product.purchase_price = price

@router.post("/", response_model=schemas.ReceiptOut)
def create_receipt(receipt_in: schemas.ReceiptCreate, db: Session = Depends(get_db)):
    user_id = receipt_in.user_id or 1
    receipt = models.Receipt(
        create_date=receipt_in.create_date,
        approval_date=receipt_in.approval_date,
        approval_person=receipt_in.approval_person,
        note=receipt_in.note,
        status=receipt_in.status or "completed",
        supplier_id=receipt_in.supplier_id,
        user_id=user_id,
    )
    db.add(receipt)
    db.flush() 

    for item in receipt_in.items:
        new_item = models.ReceiptItem(
            receipt_id=receipt.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
        )
        db.add(new_item)

        # CẬP NHẬT KHO: Nếu phiếu hoàn tất, cộng stock vào bảng Product
        if receipt.status == "completed":
            adjust_inventory(db, item.product_id, item.quantity, item.unit_price)

    db.commit()
    db.refresh(receipt)
    return receipt

@router.put("/{receipt_id}", response_model=schemas.ReceiptOut)
def update_receipt(receipt_id: int, receipt_in: schemas.ReceiptUpdate, db: Session = Depends(get_db)):
    receipt = db.query(models.Receipt).filter(models.Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(404, "Không tìm thấy phiếu nhập")
    
    # 1. HOÀN TÁC KHO CŨ (Nếu phiếu cũ đang là completed)
    if receipt.status == "completed":
        for old_item in receipt.receipt_items:
            product = db.query(models.Product).filter(models.Product.id == old_item.product_id).first()
            if product:
                product.stock -= old_item.quantity # Trừ lại số lượng cũ

    # Xử lý cập nhật ReceiptItems
    if receipt_in.items is not None:
        db.query(models.ReceiptItem).filter(models.ReceiptItem.receipt_id == receipt.id).delete()
        db.flush()
        for item in receipt_in.items:
            new_receipt_item = models.ReceiptItem(
                receipt_id=receipt.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price
            )
            db.add(new_receipt_item)
    
    db.flush()
    db.refresh(receipt)

    # 2. CẬP NHẬT KHO MỚI (Nếu trạng thái mới là completed)
    if receipt.status == "completed":
        for new_item in receipt.receipt_items:
            product = db.query(models.Product).filter(models.Product.id == new_item.product_id).first()
            if product:
                product.stock += new_item.quantity # Cộng số lượng mới
                product.purchase_price = new_item.unit_price # Cập nhật giá mới nhất

    db.commit()
    return receipt

@router.delete("/{receipt_id}")
def delete_receipt(receipt_id: int, db: Session = Depends(get_db)):
    receipt = db.query(models.Receipt).filter(models.Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(404, "Không tìm thấy phiếu")

    # TRỪ KHO: Nếu xóa phiếu đang ở trạng thái completed
    if receipt.status == "completed":
        for item in receipt.receipt_items:
            adjust_inventory(db, item.product_id, -item.quantity)

    db.delete(receipt)
    db.commit()
    return {"success": True}