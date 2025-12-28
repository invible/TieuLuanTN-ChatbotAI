// src/components/dashboard/TopProductsTable.jsx
import { useEffect, useState } from "react";
import { Card, Table, Typography, Tag } from "antd";
import { getTopProducts } from "../../services/reportApi";

const { Text } = Typography;

const TopProductsTable = ({ limit = 10, compact = true }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const res = await getTopProducts(limit);
        setData(res.data || []);
      } catch (error) {
        console.error("Lỗi load top sản phẩm:", error);
      }
    };
    fetchTop();
  }, [limit]);

  const columns = [
    {
      title: "#",
      key: "rank",
      width: 60,
      render: (_value, _record, index) => {
        const rank = index + 1;
        let color = "default";
        if (rank === 1) color = "gold";
        else if (rank === 2) color = "blue";
        else if (rank === 3) color = "cyan";

        return (
          <Tag
            color={color}
            style={{
              minWidth: 32,
              textAlign: "center",
              fontSize: compact ? 11 : 13,
            }}
          >
            {rank}
          </Tag>
        );
      },
    },
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (value) => (
        <Text
          strong
          style={{ fontSize: compact ? 12 : 14 }}
          ellipsis={{ tooltip: value }}
        >
          {value}
        </Text>
      ),
    },
    {
      title: "SL bán",
      dataIndex: "sold_quantity",
      key: "sold_quantity",
      align: "right",
      render: (value) => (
        <Text style={{ fontSize: compact ? 12 : 13 }}>{value}</Text>
      ),
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      render: (value) => (
        <Text style={{ fontSize: compact ? 12 : 13 }}>
          {Number(value).toLocaleString("vi-VN")} VND
        </Text>
      ),
    },
  ];

  return (
    <Card
      title="Top sản phẩm bán chạy"
      size={compact ? "small" : "default"}
      bordered={false}
      styles={{
        header: {
          borderRadius: "20px 20px 0 0",
          background:
            "linear-gradient(90deg, rgba(22,119,255,0.95), rgba(56,189,248,0.95))",
          color: "#fff",
          fontWeight: 600,
        },
        body: {
          padding: compact ? 8 : 16,
          background: "#ffffff",
          borderRadius: "0 0 20px 20px",
        },
      }}
      style={{
        borderRadius: 20,
        boxShadow: "0 12px 32px rgba(15,23,42,0.14)",
      }}
    >
      <Table
        columns={columns}
        dataSource={data.map((item, index) => ({ key: index, ...item }))}
        pagination={false}
        size={compact ? "small" : "middle"}
        scroll={{ y: compact ? 260 : 320 }}
      />
    </Card>
  );
};

export default TopProductsTable;
