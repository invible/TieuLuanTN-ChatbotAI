import React from "react";
import {
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Button } from "antd";

export default function CartItem({
  index,
  item,
  formatMoney,
  onIncrease,
  onDecrease,
  onRemove,
}) {
  const lineTotal = item.unitPrice * item.qty;

  return (
    <div className="cart-item">
      <div className="cart-item-index">
        {index}
      </div>

      <div className="cart-item-content">
        <div className="cart-item-info">
          <div className="name">{item.name}</div>
          <div className="price">
            Đơn giá: {formatMoney(item.unitPrice)}
          </div>
        </div>

        <div className="cart-item-qty">
          <Button
            size="small"
            icon={<MinusOutlined />}
            onClick={onDecrease}
          />
          <span className="qty">{item.qty}</span>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={onIncrease}
          />
        </div>

        <div className="cart-item-total">
          {formatMoney(lineTotal)}
        </div>

        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={onRemove}
        />
      </div>
    </div>
  );
}
