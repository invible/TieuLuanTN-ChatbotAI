// src/components/dashboard/TopProductsCard.jsx
import { Card, Table, Tag } from "antd";

const TopProductsCard = ({ products }) => {
  const columns = [
    {
      title: "Product",
      dataIndex: "product_name",
      key: "product",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background:
                record.color ||
                "linear-gradient(135deg, #4f46e5, #22d3ee)",
            }}
          />
          <span>{record.product_name || record.name}</span>
        </div>
      ),
    },
    {
      title: "Sales",
      dataIndex: "total_sales",
      key: "sales",
      render: (v, r) => v ?? r.sales ?? 0,
    },
    {
      title: "Revenue",
      dataIndex: "total_revenue",
      key: "revenue",
      render: (v, r) =>
        (v ?? r.revenue ?? 0).toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        }),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => {
        const value = (v || "").toLowerCase();
        if (value.includes("low")) {
          return <Tag color="orange">Low stock</Tag>;
        }
        return <Tag color="green">In stock</Tag>;
      },
    },
  ];

  return (
    <Card className="dashboard-card" title="Top Products" style={{ flex: 1 }}>
      <Table
        rowKey={(r) => r.product_id || r.id || r.product_name}
        size="small"
        columns={columns}
        dataSource={products}
        pagination={false}
      />
    </Card>
  );
};

export default TopProductsCard;
