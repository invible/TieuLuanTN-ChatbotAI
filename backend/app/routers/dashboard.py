from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from app.db import get_db
from app import models, schemas

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard", response_model=schemas.DashboardOverview)
def get_dashboard_overview(db: Session = Depends(get_db)):
    # Xác định mốc thời gian 12 tháng trước
    one_year_ago = datetime.now() - timedelta(days=365)

    # Tổng doanh thu
    total_revenue = db.query(func.coalesce(func.sum(models.Order.total_amount), 0)).scalar()
    # Tổng số đơn (sales)
    total_orders = db.query(func.count(models.Order.id)).scalar()
    # Tổng khách hàng (ở đây demo là distinct customer_id)
    total_customers = db.query(func.count(func.distinct(models.Order.customer_id))).scalar()

    stats = schemas.StatSummary(
        revenue=float(total_revenue),
        sales=total_orders,
        customers=total_customers,
    )

    # 1. Lấy mốc 12 tháng gần nhất
    now = datetime.now()
    # Tạo danh sách 12 tháng (định dạng MM/YYYY)
    last_12_months = []
    for i in range(11, -1, -1):
        month_date = now - relativedelta(months=i)
        last_12_months.append(month_date.strftime("%m/%Y"))

    # 2. Truy vấn dữ liệu thực tế
    one_year_ago = now - relativedelta(months=11)
    month_expr = func.date_format(models.Order.order_date, "%m/%Y")

    db_monthly = (
        db.query(
            month_expr.label("month"),
            func.sum(models.Order.total_amount).label("revenue"),
            func.count(models.Order.id).label("sales"),
        )
        .filter(models.Order.order_date >= one_year_ago.replace(day=1))
        .group_by(month_expr)
        .all()
    )

    # Chuyển dữ liệu DB thành dictionary để tra cứu nhanh
    stats_map = {row.month: row for row in db_monthly}

    # 3. Kết hợp: Nếu tháng nào không có trong DB thì gán giá trị = 0
    sales_overview = []
    for m in last_12_months:
        if m in stats_map:
            row = stats_map[m]
            sales_overview.append(schemas.SalesPoint(
                month=m,
                sales=float(row.sales),
                revenue=float(row.revenue)
            ))
        else:
            sales_overview.append(schemas.SalesPoint(
                month=m,
                sales=0,
                revenue=0
            ))

    # Traffic source: 
    category_rows = (
        db.query(
            models.Category.name.label("category"),
            func.sum(models.OrderItem.quantity * models.OrderItem.unit_price).label("revenue"),
        )
        .join(models.Product, models.Product.category_id == models.Category.id)
        .join(models.OrderItem, models.OrderItem.product_id == models.Product.id)
        .group_by(models.Category.id)
        .order_by(func.sum(models.OrderItem.quantity * models.OrderItem.unit_price).desc())
        .all()
    )
    # Gom top 5 + nhóm Khác
    traffic_sources = []
    other_revenue = 0

    for idx, row in enumerate(category_rows):
        if idx < 5:
            traffic_sources.append(
                schemas.TrafficSource(
                    name=row.category,
                    value=int(row.revenue or 0)
                )
            )
        else:
            other_revenue += int(row.revenue or 0)

    if other_revenue > 0:
        traffic_sources.append(
            schemas.TrafficSource(
                name="Khác",
                value=other_revenue
            )
        )

    # Recent activity: demo => bạn có thể map từ bảng orders, users,...
    recent_activities = []

    # Đơn hàng mới nhất
    recent_orders = (
        db.query(models.Order)
        .order_by(models.Order.order_date.desc())
        .limit(3)
        .all()
    )

    for order in recent_orders:
        recent_activities.append(
            schemas.RecentActivity(
                title="Đơn hàng mới",
                description=f"Đơn hàng #{order.id} vừa được tạo",
                time=order.order_date.strftime("%d/%m/%Y %H:%M"),
            )
        )

    # Khách hàng mới
    recent_customers = (
        db.query(models.Customer)
        .order_by(models.Customer.id.desc())
        .limit(2)
        .all()
    )

    for customer in recent_customers:
        recent_activities.append(
            schemas.RecentActivity(
                title="Khách hàng mới",
                description=f"Khách hàng {customer.name} vừa được thêm",
                time="Gần đây",
            )
        )

    # Top products: top 5 sản phẩm bán chạy nhất theo số lượng bán
    top_rows = (
        db.query(
            models.Product.id.label("product_id"),
            models.Product.name.label("product"),
            func.sum(models.OrderItem.quantity).label("sales"),
            func.sum(models.OrderItem.quantity * models.OrderItem.unit_price).label("revenue"),
        )
        .join(models.OrderItem, models.Product.id == models.OrderItem.product_id)
        .group_by(models.Product.id)
        .order_by(func.sum(models.OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    top_products = [
        schemas.TopProduct(
            key = row.product_id,
            product=row.product,
            sales=int(row.sales or 0),
            revenue=float(row.revenue or 0),
            status="In Stock",
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
