import React from "react";
import { Card, Button } from "antd";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value) || 0);

export default function Summary({
  subtotal = 0,
  vat = 0,
  grandTotal = 0,
  onCheckout,
}) {
  return (
    <Card bordered className="summary-card">
      <div className="row between">
        <span>Thành tiền:</span>
        <strong>{formatCurrency(subtotal)}</strong>
      </div>

      <div className="row between" style={{ marginTop: 8 }}>
        <span>VAT:</span>
        <strong>{formatCurrency(vat)}</strong>
      </div>

      <hr style={{ margin: "12px 0" }} />

      <div className="row between">
        <span style={{ fontSize: 16, fontWeight: 600 }}>Tổng cộng:</span>
        <span style={{ fontSize: 18, fontWeight: 700 }}>
          {formatCurrency(grandTotal)}
        </span>
      </div>

      <Button
        type="primary"
        block
        size="large"
        style={{ marginTop: 16 }}
        onClick={onCheckout}
        disabled={grandTotal <= 0}
      >
        THANH TOÁN
      </Button>
    </Card>
  );
}
