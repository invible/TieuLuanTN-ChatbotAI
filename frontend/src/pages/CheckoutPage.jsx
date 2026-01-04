import React, { useEffect, useMemo, useState } from "react";
import { 
  Layout, Button, message, Typography, Input, Table, Space, 
  AutoComplete, Modal, Select, InputNumber, Radio, Divider, Card 
} from "antd";
import { 
  DeleteOutlined, SearchOutlined, UserAddOutlined, 
  PlusOutlined, MinusOutlined, UnorderedListOutlined, UserOutlined 
} from "@ant-design/icons";

import ProductSearch from "../components/checkout/ProductSearch";
import CartItem from "../components/checkout/CartItem";
import CustomerCard from "../components/checkout/CustomerCard";
import Summary from "../components/checkout/Summary";

import { listCustomers } from "../services/customerApi";
import { listProducts } from "../services/productApi";
import { createOrder } from "../services/orderApi";

import "../styles/checkout.css";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Content, Sider, Header } = Layout;
const { Title, Text } = Typography;

export default function CheckoutPage() {
  /* ====================== STATE ====================== */
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]); // Danh sách gốc
  const [options, setOptions] = useState([]);   // Danh sách gợi ý tìm kiếm
  
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // State cho Modal chọn khách hàng
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [customerType, setCustomerType] = useState("retail"); // 'retail' hoặc 'member'
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  /* ====================== LOAD DATA ====================== */
  const fetchCustomers = async () => {
    try {
      const res = await listCustomers();
      const data = Array.isArray(res) ? res : res?.data;
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải khách hàng:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await listProducts();
      const data = Array.isArray(res) ? res : res?.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  /* ====================== SEARCH & ADD PRODUCT ====================== */
  // Xử lý tìm kiếm sản phẩm (Client-side search cho nhanh)
  const handleSearch = (value) => {
    if (!value) {
      setOptions([]);
      return;
    }
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(value.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(value.toLowerCase()))
    );
    
    // Format dữ liệu cho AutoComplete
    const searchOptions = filtered.map(p => ({
      value: p.name, // Giá trị hiển thị khi chọn
      key: p.id,     // Key định danh
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{p.name}</span>
          <span style={{ color: 'gray' }}>{new Intl.NumberFormat('vi-VN').format(p.selling_price || p.unitPrice)}đ</span>
        </div>
      ),
      product: p // Lưu object sản phẩm gốc để dùng
    }));
    setOptions(searchOptions);
  };

  const handleSelectProduct = (value, option) => {
    addToCart(option.product);
    // Reset thanh tìm kiếm sau khi chọn nếu muốn (tùy nhu cầu)
  };

  /* ====================== CART LOGIC ====================== */
  const addToCart = (product) => {
    setItems((prev) => {
      const exist = prev.find((i) => i.product_id === product.id);
      if (exist) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: product.selling_price || product.unitPrice || 0, // Fallback giá
          qty: 1,
        },
      ];
    });
    message.success(`Đã thêm ${product.name}`);
  };

  const inc = (id) => setItems((prev) => prev.map((i) => (i.product_id === id ? { ...i, qty: i.qty + 1 } : i)));
  const dec = (id) => setItems((prev) => prev.map((i) => i.product_id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i));
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.product_id !== id));

  /* ====================== CALCULATIONS ====================== */
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0), [items]);
  const vat = useMemo(() => subtotal * 0.1, [subtotal]); // VAT 10%
  const discount = vat; // giảm giá
  const grandTotal = useMemo(() => subtotal + vat, [subtotal, vat]);

  const formatMoney = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

  /* ====================== CHECKOUT (CONNECT BACKEND) ====================== */
  const handleCheckout = async ({ onDashboardRefresh }) => {
    if (items.length === 0) {
      message.warning("Giỏ hàng đang trống");
      return;
    }

    setLoading(true);
    try {
      // Chuẩn bị payload khớp với schema OrderCreate trong orders.py
      const payload = {
        user_id: 1, // TODO: Lấy ID nhân viên từ Context/LocalStorage đăng nhập
        customer_id: customer ? customer.id : null, // Backend cần handle null nếu bán cho khách lẻ
        order_date: dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DDTHH:mm:ss"),
        total_amount: grandTotal,
        note: "Bán hàng tại quầy",
        payment_method: paymentMethod,
        status: "completed", // Đơn hàng POS thường hoàn thành ngay
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.qty,
          unit_price: i.unitPrice,
          discount: 0
        })),
      };

      console.log("Sending payload:", payload); // Debug xem dữ liệu gửi đi

      await createOrder(payload);

      message.success("Thanh toán thành công!");
      setItems([]);
      setCustomer(null);
      if (onDashboardRefresh) {
        onDashboardRefresh();
      }
    } catch (err) {
      console.error("Lỗi thanh toán:", err.response?.data); // Debug 2: Xem lỗi đầy đủ trong Console
    
      let errorMsg = "Lỗi hệ thống";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        errorMsg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      }
      
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ====================== COLUMNS ====================== */
  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.sku}</Text>
        </div>
      ),
    },
    {
      title: 'Số lượng',
      key: 'qty',
      width: 130,
      render: (_, record) => (
        <Space size="small" className="qty-control">
          <Button size="small" icon={<MinusOutlined />} onClick={() => dec(record.product_id)} />
          <InputNumber 
            min={1} value={record.qty} bordered={false} 
            readOnly style={{ width: 40, textAlign: 'center' }} 
          />
          <Button size="small" icon={<PlusOutlined />} onClick={() => inc(record.product_id)} />
        </Space>
      ),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      align: 'right',
      render: (val) => formatMoney(val),
    },
    {
      title: 'Thành tiền',
      align: 'right',
      render: (_, record) => <Text strong style={{ color: '#1890ff' }}>{formatMoney(record.unitPrice * record.qty)}</Text>,
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeItem(record.product_id)} />
      ),
    },
  ];

  return (
    <Card 
      title={<Title level={3} style={{ margin: 0, color: '#1890ff' }}>Giả lập POS bán hàng</Title>}
      style={{ margin: '5px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      bodyStyle={{ padding: 0 }}
    >
    <Layout className="pos-wrapper">
      <Content className="pos-content">
        {/* --- THANH TÌM KIẾM --- */}
        <div className="pos-search-bar">
          <AutoComplete
            style={{ flex: 1 }}
            options={options}
            onSelect={handleSelectProduct}
            onSearch={handleSearch}
          >
            <Input 
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Tìm sản phẩm (Gõ tên để thêm vào giỏ)..." 
              size="large"
              allowClear
            />
          </AutoComplete>
          <Button 
              icon={<UnorderedListOutlined />} 
              size="large"
              onClick={() => setIsProductModalOpen(true)}
              title="Xem toàn bộ danh sách"
            />
        </div>

        {/* --- BẢNG GIỎ HÀNG --- */}
        <div className="pos-table-container">
          <Table 
            dataSource={items} 
            columns={columns} 
            pagination={false} 
            scroll={{ y: 'calc(100vh - 280px)' }}
            locale={{ emptyText: <div className="pos-empty">Giỏ hàng trống</div> }}
            rowKey="product_id"
          />
        </div>
      </Content>

      {/* --- SIDEBAR THANH TOÁN --- */}
      <Sider width={380} theme="light" className="pos-sider">
      {/* COMPONENT KHÁCH HÀNG 2 TÙY CHỌN */}
          <div className="sider-section customer-info">
            <div className="section-header">
              <Text strong><UserOutlined /> KHÁCH HÀNG</Text>
            </div>
            
            <Radio.Group 
              block
              options={[
                { label: 'Khách lẻ', value: 'retail' },
                { label: 'Khách cũ', value: 'member' },
              ]}
              onChange={(e) => {
                setCustomerType(e.target.value);
                if (e.target.value === 'retail') setCustomer(null);
              }}
              value={customerType}
              optionType="button"
              buttonStyle="solid"
              style={{ marginBottom: 12, width: '100%' }}
            />

            {customerType === 'member' && (
              <div className="customer-selection" style={{ marginTop: 12 }}>
                  <Button 
                    block 
                    icon={<UserAddOutlined />} 
                    onClick={() => setIsCustomerModalOpen(true)}
                    style={{ height: 'auto', padding: '8px', textAlign: 'left' }}
                  >
                    {customer ? (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{customer.name}</div>
                        <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
                          {customer.phone || "Chưa có SĐT"}
                        </div>
                      </div>
                    ) : (
                      "Bấm để chọn khách hàng"
                    )}
                  </Button>
                </div>
            )}
            
            {customerType === 'retail' && (
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <Text type="secondary">Đang áp dụng chính sách Khách lẻ</Text>
              </div>
            )}
          </div>

          <Divider />

        <div className="sider-section payment-info">
          <div className="price-row">
            <Text>Tạm tính ({items.length} khoản):</Text>
            <Text strong>{formatMoney(subtotal)}</Text>
          </div>
          <div className="price-row">
            <Text>VAT (10%):</Text>
            <Text strong>{formatMoney(vat)}</Text>
          </div>
          <div className="price-row">
            <Text>Giảm giá:</Text>
            <Text strong>- {formatMoney(discount)}</Text>
          </div>
          
          <div className="total-box">
            <Text className="total-label">TỔNG CỘNG</Text>
            <Title level={2} className="total-amount">{formatMoney(grandTotal)}</Title>
          </div>

          <div className="payment-methods">
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Phương thức thanh toán</Text>
            <Space wrap>
              <Button 
                type={paymentMethod === "Tiền mặt" ? "primary" : "default"} 
                onClick={() => setPaymentMethod("Tiền mặt")}
              >
                Tiền mặt
              </Button>
              <Button 
                type={paymentMethod === "Chuyển khoản" ? "primary" : "default"} 
                onClick={() => setPaymentMethod("Chuyển khoản")}
              >
                Chuyển khoản
              </Button>
              <Button 
                type={paymentMethod === "Thẻ (POS)" ? "primary" : "default"} 
                onClick={() => setPaymentMethod("Thẻ (POS)")}
              >
                Thẻ (POS)
              </Button>
            </Space>
          </div>

          <Button 
            type="primary" block size="large" className="btn-checkout" 
            onClick={handleCheckout}
            loading={loading}
            disabled={items.length === 0}
          >
            THANH TOÁN
          </Button>
        </div>
      </Sider>

      {/* --- MODAL CHỌN KHÁCH HÀNG --- */}
      <Modal
        title="Chọn khách hàng"
        open={isCustomerModalOpen}
        onCancel={() => setIsCustomerModalOpen(false)}
        footer={null}
      >
        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="Tìm tên hoặc số điện thoại..."
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          onChange={(val) => {
            const cus = customers.find(c => c.id === val);
            setCustomer(cus);
            setIsCustomerModalOpen(false);
          }}
          options={customers.map(c => ({
            value: c.id,
            label: `${c.name} - ${c.phone}`
          }))}
        />
        <div style={{ marginTop: 16, textAlign: 'center' }}>
           <Button type="dashed" block icon={<UserAddOutlined />}>Thêm khách mới</Button>
        </div>
      </Modal>

      {/* MODAL HIỂN THỊ TOÀN BỘ SẢN PHẨM */}
      <Modal
        title="Danh sách sản phẩm trong kho"
        open={isProductModalOpen}
        onCancel={() => setIsProductModalOpen(false)}
        width={800}
        footer={null}
      >
        <Table 
          dataSource={products}
          rowKey="id"
          columns={[
            { title: 'Tên', dataIndex: 'name' },
            { title: 'Giá', dataIndex: 'selling_price', render: (v) => formatMoney(v) },
            { title: 'Tồn kho', dataIndex: 'stock' },
            { 
              title: 'Hành động', 
              render: (_, record) => (
                <Button type="link" onClick={() => { addToCart(record); setIsProductModalOpen(false); }}>
                  Thêm vào giỏ
                </Button>
              ) 
            }
          ]}
        />
      </Modal>
    </Layout>
    </Card>
  );
}