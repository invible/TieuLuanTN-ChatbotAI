// src/components/dashboard/StatCardsRow.jsx
import { Card } from "antd";

const StatCardsRow = ({
  totalRevenue,
  totalSales,
  totalCustomers,
  bounceRate,
}) => {
  return (
    <div className="dashboard-row dashboard-row-cards">
      <Card className="stat-card stat-card-green">
        <div className="stat-label">REVENUE</div>
        <div className="stat-value">
          {totalRevenue.toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
          })}
        </div>
        <div className="stat-sub">Tổng doanh thu (all time)</div>
      </Card>

      <Card className="stat-card stat-card-purple">
        <div className="stat-label">SALES</div>
        <div className="stat-value">{totalSales}</div>
        <div className="stat-sub">Tổng số đơn hàng</div>
      </Card>

      <Card className="stat-card stat-card-blue">
        <div className="stat-label">CUSTOMERS</div>
        <div className="stat-value">{totalCustomers}</div>
        <div className="stat-sub">Khách hàng đã phát sinh đơn</div>
      </Card>

      <Card className="stat-card stat-card-orange">
        <div className="stat-label">BOUNCE RATE</div>
        <div className="stat-value">{bounceRate.toFixed(1)}%</div>
        <div className="stat-sub">
          Tỷ lệ đơn huỷ / tổng đơn (ước lượng)
        </div>
      </Card>
    </div>
  );
};

export default StatCardsRow;
