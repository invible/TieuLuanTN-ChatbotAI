from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func 
from typing import List

from app.db import get_db
from app import models, schemas

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/", response_model=List[schemas.CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    rows = (
        db.query(
            models.Customer,
            func.count(models.Order.id).label("order_count"), # <--- Tính tổng đơn
            func.sum(models.Order.total_amount).label("total_spent") # <--- Tính tổng chi tiêu
        )
        .outerjoin(models.Order, models.Order.customer_id == models.Customer.id)
        .group_by(models.Customer.id)
        .all()
    )

    result = []
    for customer, order_count, total_spent in rows:
        result.append({
            "id": customer.id,
            "name": customer.name,
            "date_of_birth": customer.date_of_birth,
            "gender": customer.gender,
            "address": customer.address,
            "phone": customer.phone,
            "order_count": int(order_count or 0),
            "total_spent": float(total_spent or 0),
        })

    return result

@router.get("/{customer_id}/count")
def count_orders_by_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(404, "Khách hàng không tồn tại")

    total = (
        db.query(func.count(models.Order.id))
        .filter(models.Order.customer_id == customer_id)
        .scalar()
    ) or 0

    return {"customer_id": customer_id, "order_count": int(total)}

@router.post("/", response_model=schemas.CustomerOut)
def create_customer(customer_in: schemas.CustomerCreate, db: Session = Depends(get_db)):
    obj = models.Customer(**customer_in.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(customer_id: str, customer_in: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    obj = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
    for field, value in customer_in.dict(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{customer_id}")
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    obj = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
    db.delete(obj)
    db.commit()
    return {"success": True}
