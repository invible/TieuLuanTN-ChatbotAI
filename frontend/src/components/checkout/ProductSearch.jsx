import React, { useMemo, useState } from "react";
import { Input, List, Button, Spin } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

export default function ProductSearch({ products = [], onAdd }) {
  const [keyword, setKeyword] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    const base = products.filter((p) => p.stock > 0);
    const k = keyword.trim().toLowerCase();

    if (k) {
      return base.filter((p) =>
        p.name?.toLowerCase().includes(k)
      );
    }

    return showAll ? base : [];
  }, [products, keyword, showAll]);

  return (
    <div className="product-search">
      <Input
        allowClear
        placeholder="Tìm sản phẩm (chỉ hiện sản phẩm còn hàng)"
        prefix={<SearchOutlined />}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        suffix={
          <Button
            type={showAll ? "primary" : "text"}
            icon={<UnorderedListOutlined />}
            onClick={() => setShowAll((v) => !v)}
          />
        }
      />

      {(keyword || showAll) && (
        <List
          style={{ marginTop: 12 }}
          bordered
          locale={{ emptyText: "Không có sản phẩm phù hợp" }}
          dataSource={filteredProducts}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={() => onAdd(item)}
                >
                  Thêm
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={item.name}
                description={`Còn: ${item.stock}`}
              />
              <strong>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(item.selling_price)}
              </strong>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
