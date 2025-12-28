// src/components/dashboard/OverviewStats.jsx
import { useEffect, useState } from "react";
import { Row, Col, Card, Statistic } from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";
import { getOverviewStats } from "../../services/reportApi";

const OverviewStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getOverviewStats();
        setStats(res.data);
      } catch (error) {
        console.error("Lỗi load thống kê:", error);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <p>Đang tải thống kê...</p>;

  const cards = [
    {
      key: "total_users",
      title: "Tổng khách hàng",
      value: stats.total_users,
      suffix: "",
      gradient: "linear-gradient(135deg,#1677ff,#36cfc9)",
    },
    {
      key: "total_products",
      title: "Tổng sản phẩm",
      value: stats.total_products,
      suffix: "",
      gradient: "linear-gradient(135deg,#13c2c2,#52c41a)",
    },
    {
      key: "total_orders",
      title: "Tổng đơn hàng",
      value: stats.total_orders,
      suffix: "",
      gradient: "linear-gradient(135deg,#faad14,#f5222d)",
    },
    {
      key: "total_revenue",
      title: "Tổng doanh thu",
      value: stats.total_revenue,
      suffix: "VND",
      gradient: "linear-gradient(135deg,#722ed1,#eb2f96)",
    },
  ];

  return (
    <Row gutter={16}>
      {cards.map((item) => (
        <Col key={item.key} xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 20,
              boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
              overflow: "hidden",
              background: "#0f172a",
            }}
            styles={{
              body: { padding: 16 },
            }}
          >
            <div
              style={{
                background: item.gradient,
                borderRadius: 16,
                padding: 12,
                color: "#fff",
                minHeight: 90,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.9,
                  marginBottom: 4,
                }}
              >
                {item.title}
              </div>
              <Statistic
                value={item.value}
                suffix={item.suffix}
                valueStyle={{
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: 600,
                }}
                prefix={<ArrowUpOutlined style={{ opacity: 0.9 }} />}
              />
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default OverviewStats;
