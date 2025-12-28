from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.db import get_db
from app.models import Product, Customer, Order,OrderItem

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/overview-stats")
def overview_stats(db: Session = Depends(get_db)):
    """
    Thống kê tổng quan:
    - total_users: tổng số khách hàng (KHACH_HANG)
    - total_products: tổng số sản phẩm (SAN_PHAM)
    - total_orders: tổng số đơn hàng (DON_HANG)
    - total_revenue: tổng doanh thu (tổng DH_ThanhTien)
    - completed_orders: số đơn trạng thái = 'completed'
    """
    total_users = db.query(func.count(Customer.id)).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    total_revenue = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0))
        .scalar()
        or 0
    )

    completed_orders = (
        db.query(func.count(Order.ma_dh))
        .filter(Order.status == "completed")
        .scalar()
        or 0
    )

    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
        "completed_orders": completed_orders,
    }


@router.get("/revenue-by-month")
def revenue_by_month(year: int, db: Session = Depends(get_db)):
    """
    Doanh thu theo tháng trong 1 năm (dùng trường DH_NgayXuat).
    """
    rows = (
        db.query(
            extract("month", Order.order_date).label("month"),
            func.sum(Order.total_amount).label("total"),
        )
        .filter(extract("year", Order.order_date) == year)
        .group_by("month")
        .order_by("month")
        .all()
    )

    return [
        {"month": f"{int(row.month):02d}", "total": float(row.total or 0)}
        for row in rows
    ]


@router.get("/top-products")
def top_products(limit: int = 5, db: Session = Depends(get_db)):
    """
    Top sản phẩm theo doanh thu:
    - Join SAN_PHAM + CHI_TIET_DON_HANG + DON_HANG
    - Chỉ tính đơn hàng trạng thái 'completed'
    """
    rows = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("name"),
            func.sum(OrderItem.quantity).label("sold_quantity"),
            func.sum(
                OrderItem.quantity * OrderItem.unit_price
            ).label("revenue"),
        )
        .join(OrderItem, Product.id == OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status == "completed")
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderItem.quantity * OrderItem.unit_price).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "product_id": row.product_id,
            "name": row.name,
            "sold_quantity": int(row.sold_quantity or 0),
            "revenue": float(row.revenue or 0),
        }
        for row in rows
    ]


@router.get("/revenue-range")
def revenue_range(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
):
    """
    Doanh thu theo ngày trong khoảng start_date - end_date.
    Chỉ tính DON_HANG có trạng thái 'completed'.
    """
    rows = (
        db.query(
            Order.order_date.label("date"),
            func.sum(Order.total_amount).label("total"),
        )
        .filter(
            Order.order_date >= start_date,
            Order.order_date <= end_date,
            Order.status == "completed",
        )
        .group_by(Order.order_date)
        .order_by(Order.order_date)
        .all()
    )

    return [
        {
            "date": row.date.isoformat(),
            "total": float(row.total or 0),
        }
        for row in rows
    ]
