from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app import models, schemas

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/", response_model=List[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).all()


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Đơn hàng không tồn tại")
    return order

def adjust_inventory(db: Session, product_id: int, quantity_change: int):
    """
    quantity_change > 0: Tăng kho (khi xóa đơn/hoàn trả)
    quantity_change < 0: Giảm kho (khi bán hàng)
    """
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product:
        # Kiểm tra nếu bán hàng mà không đủ tồn kho
        if quantity_change < 0 and product.stock < abs(quantity_change):
            raise HTTPException(400, f"Sản phẩm {product.name} không đủ tồn kho (Hiện có: {product.stock})")
        product.stock += quantity_change

@router.post("/", response_model=schemas.OrderOut)
def create_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    # 1. Kiểm tra user
    user = db.query(models.User).filter(models.User.id == order_in.user_id).first()
    if not user:
        raise HTTPException(400, "Người dùng không tồn tại")

    # 2. Tạo header đơn hàng
    order = models.Order(
        user_id=order_in.user_id,
        customer_id=order_in.customer_id,
        order_date=order_in.order_date,
        total_amount=order_in.total_amount,
        note=order_in.note,
        payment_method=order_in.payment_method,
        status=order_in.status or "completed"
    )
    db.add(order)
    db.flush() # Để lấy order.id

    # 3. Tạo items và trừ kho
    for item in order_in.items:
        new_item = models.OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount=item.discount
        )
        db.add(new_item)
        
        # Chỉ trừ kho nếu đơn hàng ở trạng thái 'completed'
        if order.status == "completed":
            adjust_inventory(db, item.product_id, -item.quantity)

    db.commit()
    db.refresh(order)
    return order

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Đơn hàng không tồn tại")

    # HOÀN KHO: Nếu xóa đơn hàng đang 'completed', phải cộng lại số lượng vào kho
    if order.status == "completed":
        for item in order.order_items:
            adjust_inventory(db, item.product_id, item.quantity)

    # Xoá chi tiết đơn hàng (nếu chưa set Cascade delete trong DB)
    db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).delete()

    db.delete(order)
    db.commit()
    return {"success": True}