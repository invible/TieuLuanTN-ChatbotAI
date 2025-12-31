import React from "react";
import { Card, Tag } from "antd";
import { UserOutlined, PhoneOutlined } from "@ant-design/icons";

export default function CustomerCard({
  name,
  phone,
}) {
  const isGuest = !name && !phone;

  return (
    <Card
      title="Thông tin khách hàng"
      bordered
      className="customer-card"
      size="small"
    >
      <div className="row between">
        <span>
          <UserOutlined style={{ marginRight: 6 }} />
          Khách hàng
        </span>
        <strong>
          {isGuest ? (
            <Tag color="blue">Khách lẻ</Tag>
          ) : (
            name
          )}
        </strong>
      </div>

      <div className="row between" style={{ marginTop: 8 }}>
        <span>
          <PhoneOutlined style={{ marginRight: 6 }} />
          SĐT
        </span>
        <strong>{phone || "—"}</strong>
      </div>
    </Card>
  );
}
