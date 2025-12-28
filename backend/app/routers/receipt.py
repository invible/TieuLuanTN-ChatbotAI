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

@router.post("/", response_model=schemas.ReceiptOut)
def create_receipt(receipt_in: schemas.ReceiptCreate, db: Session = Depends(get_db)):
    # Nếu bạn dùng current_user, có thể override user_id ở đây
    # current_user: User = Depends(get_current_user)
    # user_id = current_user.id
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
    db.flush()  # để có receipt.id

    for item in receipt_in.items:
        db.add(
            models.ReceiptItem(
                receipt_id=receipt.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
        )

    db.commit()
    db.refresh(receipt)
    return receipt

@router.put("/{receipt_id}", response_model=schemas.ReceiptOut)
def update_receipt(
    receipt_id: int,
    receipt_in: schemas.ReceiptUpdate,
    db: Session = Depends(get_db),
):
    receipt = db.query(models.Receipt).filter(models.Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(404, "Phiếu nhập không tồn tại")

    # update header
    for field in [
        "create_date",
        "approval_date",
        "approval_person",
        "note",
        "status",
        "supplier_id",
        "user_id",
    ]:
        value = getattr(receipt_in, field, None)
        if value is not None:
            setattr(receipt, field, value)

    # nếu có gửi kèm items -> thay toàn bộ list cũ
    if receipt_in.items is not None:
        # xoá hết items cũ
        db.query(models.ReceiptItem).filter(models.ReceiptItem.receipt_id == receipt.id).delete()
        db.flush()
        # tạo lại
        for item in receipt_in.items:
            db.add(
                models.ReceiptItem(
                    receipt_id=receipt.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                )
            )

    db.commit()
    db.refresh(receipt)
    return receipt

@router.delete("/{receipt_id}")
def delete_receipt(receipt_id: int, db: Session = Depends(get_db)):
    receipt = db.query(models.Receipt).filter(models.Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(404, "Phiếu nhập không tồn tại")

    db.delete(receipt)
    db.commit()
    return {"message": "Phiếu nhập đã được xóa"}

