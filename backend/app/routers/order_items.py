from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import get_db
from app import models, schemas

router = APIRouter(prefix="/order-items", tags=["Order Items"])


@router.get("/", response_model=List[schemas.OrderItemOut])
def list_order_items(
    order_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Nếu truyền ?order_id=... -> trả về items của 1 đơn.
    Nếu không -> trả về tất cả order_items.
    """
    q = db.query(models.OrderItem)
    if order_id is not None:
        q = q.filter(models.OrderItem.order_id == order_id)
    return q.all()


@router.get("/{order_id}/{item_id}", response_model=schemas.OrderItemOut)
def get_order_item(order_id: int, item_id: int, db: Session = Depends(get_db)):
    """
    Lấy 1 dòng chi tiết đơn hàng theo mã đơn hàng và mã sản phẩm.
    """
    item = db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id,models.OrderItem.product_id == item_id).first()

    if not item:
        raise HTTPException(404, "Chi tiết đơn hàng không tồn tại")
    return item


@router.post("/", response_model=schemas.OrderItemOut)
def create_order_item(
    item_in: schemas.OrderItemCreate,
    db: Session = Depends(get_db),
):
    # kiểm tra order tồn tại
    order = db.query(models.Order).filter(models.Order.id == item_in.order_id).first()
    if not order:
        raise HTTPException(400, "Đơn hàng không tồn tại")

    # kiểm tra product tồn tại
    product = (
        db.query(models.Product).filter(models.Product.id == item_in.product_id).first()
    )
    if not product:
        raise HTTPException(400, "Sản phẩm không tồn tại")

    item = models.OrderItem(**item_in.dict())

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{order_id}/{item_id}", response_model=schemas.OrderItemOut)
def update_order_item(
    order_id: int,
    item_id: int,
    item_in: schemas.OrderItemCreate,
    db: Session = Depends(get_db),
):
    item = db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id, models.OrderItem.product_id == item_id).first()
    if not item:
        raise HTTPException(404, "Chi tiết đơn hàng không tồn tại")

    data = item_in.dict(exclude_unset=True)

    # Khoá chính (ma_dh, sp_ma_sp) không được đổi, nên bỏ ra nếu có
    data.pop("orders_id", None)
    data.pop("products_id", None)

    for field, value in data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{ma_dh}/{item_id}")
def delete_order_item(order_id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id, models.OrderItem.product_id == item_id).first()

    if not item:
        raise HTTPException(404, "Chi tiết đơn hàng không tồn tại")

    db.delete(item)
    db.commit()
    return {"success": True}
