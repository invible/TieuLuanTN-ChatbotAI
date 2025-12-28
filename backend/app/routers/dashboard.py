from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app import models, schemas

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard", response_model=schemas.DashboardOverview)
def get_dashboard_overview(db: Session = Depends(get_db)):
    # Tổng doanh thu
    total_revenue = db.query(func.coalesce(func.sum(models.Order.total_amount), 0)).scalar()
    # Tổng số đơn (sales)
    total_orders = db.query(func.count(models.Order.id)).scalar()
    # Tổng khách hàng (ở đây demo là distinct customer_id)
    total_customers = db.query(func.count(func.distinct(models.Order.customer_id))).scalar()

    # Demo: bounce rate fake (sau bạn có thể tính thật)
    bounce_rate = 47.0

    stats = schemas.StatSummary(
        revenue=float(total_revenue),
        sales=total_orders,
        customers=total_customers,
        bounce_rate=bounce_rate,
    )

    # Sales theo tháng (demo, tính 12 tháng gần nhất)
    monthly = (
        db.query(
            func.date_format(models.Order.order_date, "%b").label("month"),
            func.sum(models.Order.total_amount).label("revenue"),
            func.count(models.Order.id).label("sales"),
        )
        .group_by(func.date_format(models.Order.order_date, "%Y-%m"))
        .order_by(func.min(models.Order.order_date))
        .limit(12)
        .all()
    )
    sales_overview = [
        schemas.SalesPoint(
            month=row.month,
            sales=float(row.sales),
            revenue=float(row.revenue),
        )
        for row in monthly
    ]

    # Traffic source: demo cứng (sau này bạn có thể lấy từ DB / GA)
    traffic_sources = [
        schemas.TrafficSource(name="Direct", value=45),
        schemas.TrafficSource(name="Social", value=30),
        schemas.TrafficSource(name="Referral", value=25),
    ]

    # Recent activity: demo => bạn có thể map từ bảng orders, users,...
    recent_activities = [
        schemas.RecentActivity(
            title="New order received",
            description="Order #12345 from John Doe",
            time="2 minutes ago",
        ),
        schemas.RecentActivity(
            title="New customer registered",
            description="Jane Smith joined the platform",
            time="15 minutes ago",
        ),
    ]

    # Top products: top 5 theo doanh thu
    top_rows = (
        db.query(
            models.Product.id.label("product_id"),
            models.Product.name.label("product"),
            func.sum(models.OrderItem.quantity).label("sales"),
            func.sum(models.OrderItem.quantity * models.OrderItem.unit_price).label("revenue"),
        )
        .join(models.OrderItem, models.Product.id == models.OrderItem.product_id)
        .group_by(models.Product.id)
        .order_by(func.sum(models.OrderItem.quantity * models.OrderItem.unit_price).desc())
        .limit(5)
        .all()
    )

    top_products = [
        schemas.TopProduct(
            key = row.product_id,
            product=row.product,
            sales=int(row.sales or 0),
            revenue=float(row.revenue or 0),
            status="In Stock",  # sau này check theo stock
        )
        for row in top_rows
    ]

    return schemas.DashboardOverview(
        stats=stats,
        sales_overview=sales_overview,
        traffic_sources=traffic_sources,
        recent_activities=recent_activities,
        top_products=top_products,
    )
