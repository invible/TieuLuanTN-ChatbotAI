import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Tag,
  message,
  Button,
  Drawer,
  Descriptions,
  Space,
  Input,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Select,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  listOrders,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../services/orderApi";
import { listOrderItemsByOrder } from "../services/orderItemApi";

// 👇 thêm các API mới
import { listCustomers } from "../services/customerApi";
import { listUsers } from "../services/userApi";
import { listProducts } from "../services/productApi";

const { Search } = Input;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // 👇 dữ liệu map tên
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);

  const [form] = Form.useForm();

  // ====== Fetch data ======
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await listOrders();
      setOrders(res.data || []);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      message.error("Không tải được danh sách đơn hàng");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchOrderItems = async (orderId) => {
    try {
      setLoadingItems(true);
      const res = await listOrderItemsByOrder(orderId);
      setOrderItems(res.data || []);
    } catch (error) {
      console.error("Lỗi tải chi tiết đơn hàng:", error);
      message.error("Không tải được chi tiết đơn hàng");
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await listCustomers();
      const data = Array.isArray(res) ? res : res?.data;
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải khách hàng:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await listUsers();
      const data = Array.isArray(res) ? res : res?.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải nhân viên:", error);
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
    fetchOrders();
    fetchCustomers();
    fetchUsers();
    fetchProducts();
  }, []);

  // ====== Maps id -> name ======
  const customerMap = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [customers]);

  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(u.id, u.name || u.full_name || u.username));
    return map;
  }, [users]);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [products]);

  // options cho Select
  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [customers]
  );

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.name || u.full_name || u.username,
      })),
    [users]
  );

  // helpers map tên
  const getCustomerName = (order) => {
    if (order.customer?.name) return order.customer.name;
    if (customerMap.has(order.customer_id))
      return customerMap.get(order.customer_id);
    if (order.customer_id) return `#${order.customer_id}`;
    return "Khách lẻ";
  };

  const getUserName = (order) => {
    if (order.user?.name) return order.user.name;
    if (userMap.has(order.user_id)) return userMap.get(order.user_id);
    if (order.user_id) return `#${order.user_id}`;
    return "-";
  };

  const getProductName = (item) => {
    if (item.product?.name) return item.product.name;
    if (productMap.has(item.product_id))
      return productMap.get(item.product_id);
    return `#${item.product_id}`;
  };

  const getProductUnit = (item) => {
    if (item.product?.unit) return item.product.unit;
    if (productMap.has(item.product_id)) {
      const product = products.find(
        (p) => p.id === item.product_id
      );
      return product?.unit || "-";
    }
  }

  // ====== Modal mở/đóng ======
  const openCreateModal = () => {
    setEditingOrder(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingOrder(record);
    form.setFieldsValue({
      user_id: record.user_id,
      customer_id: record.customer_id,
      total_amount: Number(record.total_amount),
      status: record.status,
      payment_method: record.payment_method,
      note: record.note,
      order_date: record.order_date ? dayjs(record.order_date) : null,
    });
    setIsModalOpen(true);
  };

  const handleCancelOrder = (record) => {
    Modal.confirm({
      title: "Hủy đơn hàng?",
      content: `Bạn chắc chắn muốn hủy đơn #${record.id}? Trạng thái sẽ chuyển sang 'cancelled' và hoàn tồn kho.`,
      okText: "Xác nhận hủy",
      cancelText: "Đóng",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          // Gọi API update đơn hàng sang trạng thái cancelled
          await updateOrder(record.id, { 
            ...record, // giữ các thông tin cũ
            status: "cancelled" 
          });
          message.success("Đã hủy đơn hàng thành công");
          fetchOrders(); // Load lại danh sách
        } catch (error) {
          console.error("Lỗi hủy đơn:", error);
          message.error("Không thể hủy đơn hàng");
        }
      },
    });
  };

  const openDrawer = (record) => {
    setSelectedOrder(record);
    setDrawerOpen(true);
    fetchOrderItems(record.id);
  };

  const handleSubmit = async (values) => {
    const payload = {
      user_id: Number(values.user_id),
      customer_id: Number(values.customer_id),
      total_amount: Number(values.total_amount),
      status: values.status,
      payment_method: values.payment_method,
      note: values.note || null,
      order_date: values.order_date
        ? values.order_date.format("YYYY-MM-DD HH:mm:ss")
        : null,
    };

    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id, payload);
        message.success("Cập nhật đơn hàng thành công");
      } else {
        await createOrder(payload);
        message.success("Tạo đơn hàng thành công");
      }
      setIsModalOpen(false);
      setEditingOrder(null);
      form.resetFields();
      fetchOrders();
    } catch (error) {
      console.error("Lỗi lưu đơn hàng:", error);
      message.error("Không lưu được đơn hàng");
    }
  };

  // ====== Filter search (theo id + tên KH + tên NV) ======
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (searchText) {
      const text = searchText.toLowerCase();
      result = orders.filter((o) => {
        const customerName = getCustomerName(o).toLowerCase?.() || "";
        const userName = getUserName(o).toLowerCase?.() || "";
        return (
          String(o.id).includes(text) ||
          customerName.includes(text) ||
          userName.includes(text) ||
          o.status?.toLowerCase().includes(text)
        );
      });
    }
    return [...result].sort((a, b) => {
    return new Date(b.order_date) - new Date(a.order_date);
    });
  }, [orders, searchText, customerMap, userMap]);

  // ====== Columns ======
  const orderColumns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Ngày đặt",
      dataIndex: "order_date",
      key: "order_date",
      render: (value) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
      sorter: (a, b) =>
        new Date(a.order_date) - new Date(b.order_date),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_id",
      key: "customer_id",
      width: 200,
      render: (_, record) => getCustomerName(record),
      sorter: (a, b) => a.customer_id - b.customer_id,
    },
    {
      title: "Nhân viên bán hàng",
      dataIndex: "user_id",
      key: "user_id",
      width: 180,
      render: (_, record) => getUserName(record),
      sorter: (a, b) => a.user_id - b.user_id,
    },
    {
      title: "Tổng tiền (VND)",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right",
      render: (value) => `${Number(value).toLocaleString()}`,
    },
    {
      title: "Thanh toán",
      dataIndex: "payment_method",
      key: "payment_method",
      render: (value) => {
        if (value === "Tiền mặt")
          return <Tag color="blue">Tiền mặt</Tag>;
        if (value === "Chuyển khoản")
          return <Tag color="geekblue">Chuyển khoản</Tag>;
        return value;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (value) => {
        if (value === "completed")
          return <Tag color="green">completed</Tag>;
        if (value === "pending")
          return <Tag color="orange">pending</Tag>;
        if (value === "cancelled")
          return <Tag color="red">cancelled</Tag>;
        return <Tag>{value}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      width: 210,
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => openDrawer(record)}>Chi tiết</Button>
          
          {/* Nút hủy đơn (ẩn nếu đơn đã bị hủy rồi) */}
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            disabled={record.status === 'cancelled'}
            onClick={() => handleCancelOrder(record)}
          >
            Hủy đơn
          </Button>
        </Space>
      ),
    },
  ];

  const orderItemColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "product_id",
      key: "product_id",
      render: (_, record) => getProductName(record),
    },
    {
      title: "ĐVT",
      dataIndex: "unit",
      key: "unit",
      align: "center",
      render: (_, record) => getProductUnit(record),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
    },
    {
      title: "Đơn giá (VND)",
      dataIndex: "unit_price",
      key: "unit_price",
      align: "right",
      render: (v) => `${Number(v).toLocaleString()}`,
    },
    {
      title: "Giảm giá (VND)",
      dataIndex: "discount",
      key: "discount",
      align: "right",
      render: (v) =>
        v ? `${Number(v).toLocaleString()}` : "0",
    },
    {
      title: "Thành tiền (VND)",
      key: "total",
      align: "right",
      render: (_, record) => {
        const subtotal =
          Number(record.unit_price) * record.quantity -
          Number(record.discount || 0);
        return `${subtotal.toLocaleString()}`;
      },
    },
  ];

  return (
    <>
        <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Đơn hàng</h1>
        <p className="dashboard-subtitle">Quản lý đơn hàng</p>
      </div>
      <Card
        title="Danh sách đơn hàng"
        extra={
          <Space>
            <Search
              placeholder="Tìm theo mã đơn, khách hàng,..."
              allowClear
              onSearch={(v) => setSearchText(v)}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 320 }}
              prefix={<SearchOutlined />}
            />
          </Space>
        }
      >
        <Table
          rowKey="id"
          dataSource={filteredOrders}
          columns={orderColumns}
          loading={loadingOrders}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/* Modal tạo / sửa đơn */}
      <Modal
        title={editingOrder ? "Cập nhật đơn hàng" : "Tạo đơn hàng"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingOrder(null);
        }}
        onOk={() => form.submit()}
        okText={editingOrder ? "Cập nhật" : "Tạo mới"}
        cancelText="Huỷ"
        destroyOnClose
        forceRender
      >
  <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Nhân viên" name="user_id">
            <Select options={userOptions} disabled={!!editingOrder} /> 
          </Form.Item>

          <Form.Item label="Khách hàng" name="customer_id">
            <Select options={customerOptions} disabled={!!editingOrder} />
          </Form.Item>

          <Form.Item label="Ngày đặt" name="order_date">
            <DatePicker style={{ width: "100%" }} showTime disabled={!!editingOrder} />
          </Form.Item>

          <Form.Item label="Tổng tiền (VND)" name="total_amount">
            <InputNumber style={{ width: "100%" }} disabled={!!editingOrder} />
          </Form.Item>

          <Form.Item label="Hình thức thanh toán" name="payment_method">
            <Select disabled={!!editingOrder}>
              <Select.Option value="Tiền mặt">Tiền mặt</Select.Option>
              <Select.Option value="Chuyển khoản">Chuyển khoản</Select.Option>
            </Select>
          </Form.Item>

          {/* Hai trường này luôn được phép sửa */}
          <Form.Item label="Trạng thái" name="status">
            <Select>
              <Select.Option value="completed">completed</Select.Option>
              <Select.Option value="pending">pending</Select.Option>
              <Select.Option value="cancelled">cancelled</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer chi tiết đơn */}
      <Drawer
        title={
          selectedOrder
            ? `Chi tiết đơn hàng #${selectedOrder.id}`
            : "Chi tiết đơn hàng"
        }
        placement="right"
        width={620}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        {selectedOrder && (
          <>
            <Descriptions
              bordered
              size="small"
              column={1}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Mã đơn">
                #{selectedOrder.id}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">
                {selectedOrder.order_date
                  ? dayjs(selectedOrder.order_date).format(
                      "DD/MM/YYYY HH:mm"
                    )
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                {getCustomerName(selectedOrder)}
              </Descriptions.Item>
              <Descriptions.Item label="Nhân viên">
                {getUserName(selectedOrder)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                {Number(
                  selectedOrder.total_amount
                ).toLocaleString()}{" "}
                VND
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                {selectedOrder.payment_method}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {selectedOrder.status}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú">
                {selectedOrder.note || "-"}
              </Descriptions.Item>
            </Descriptions>

            <Table
              rowKey="id"
              size="small"
              title={() => "Chi tiết sản phẩm"}
              dataSource={orderItems}
              columns={orderItemColumns}
              loading={loadingItems}
              pagination={false}
            />
          </>
        )}
      </Drawer>
      </div>
    </>
  );
};

export default OrdersPage;
