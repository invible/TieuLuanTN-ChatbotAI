import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Table,
  DatePicker,
  Select,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import {
  listCustomers,
  count_orders_by_customer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../services/customerApi";

const { Search } = Input;

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await listCustomers();
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Lỗi tải khách hàng:",err);
      message.error("Không tải được khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      gender: record.gender,
      address: record.address,
      phone: record.phone,
      date_of_birth: record.date_of_birth
        ? dayjs(record.date_of_birth)
        : null,
    });
    setModalOpen(true);
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: "Xoá khách hàng",
      content: `Bạn chắc chắn muốn xoá "${record.name}"?`,
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await deleteCustomer(record.id);
          message.success("Đã xoá");
          fetchCustomers();
        } catch (err) {
          console.error("Lỗi xoá khách hàng:", err);
          message.error("Xoá thất bại");
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // chuyển date_of_birth thành chuỗi 'YYYY-MM-DD' gửi về backend
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth
          ? values.date_of_birth.format("YYYY-MM-DD")
          : null,
      };

      if (editing) {
        await updateCustomer(editing.id, payload);
        message.success("Cập nhật khách hàng thành công");
      } else {
        await createCustomer(payload);
        message.success("Thêm khách hàng thành công");
      }

      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchCustomers();
    } catch (err) {
      if (err?.errorFields) return; // lỗi validate của antd
      console.error("Lỗi lưu khách hàng:", err);
      message.error("Lưu khách hàng thất bại");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
      key: "id",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Họ tên",
      dataIndex: "name",
      key: "name",
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "Ngày sinh",
      dataIndex: "date_of_birth",
      key: "date_of_birth",
      render: (value) =>
        value ? dayjs(value).format("DD/MM/YYYY") : "",
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
    },
    {
      title: "Tổng đơn",
      dataIndex: "order_count",
      key: "order_count",
      width: 100,
      align: "right",
      render: (value) => <strong>{value ?? 0}</strong>,
      sorter: (a, b) => (a.order_count ?? 0) - (b.order_count ?? 0),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            Sửa
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleDelete(record)}
          >
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

    const filteredCustomers = useMemo(() => {
      if (!searchText) return customers;
      const text = searchText.toLowerCase();
      return customers.filter((u) => {
        return (
          String(u.id).includes(text) ||
          u.name?.toLowerCase().includes(text) ||
          u.address?.toLowerCase().includes(text) ||
          u.phone?.toLowerCase().includes(text)
        );
      });
    }, [customers, searchText]);
  

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Khách hàng</h1>
        <p className="dashboard-subtitle">Quản lý khách hàng</p>
      </div>

      <Card
        className="dashboard-card"
        title="Danh sách khách hàng"
        extra={
          <Space>
            <Search
              placeholder="Tìm theo tên, địa chỉ, SĐT..."
              allowClear
              onSearch={(v) => setSearchText(v)}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 320 }}
              prefix={<SearchOutlined />}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
            >
              Thêm khách hàng
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredCustomers}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={editing ? "Cập nhật khách hàng" : "Thêm khách hàng"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onOk={handleSubmit}
        okText="Lưu"
        destroyOnClose
      >
        <Form 
        layout="vertical" 
        form={form} 
        preserve={false}
        initialValues={editing ? {
      ...editing,
      date_of_birth: editing.date_of_birth ? dayjs(editing.date_of_birth) : null
    } : {}}
        >
          <Form.Item
            label="Họ tên"
            name="name"
            rules={[{ required: true, message: "Nhập họ tên" }]}
          >
            <Input placeholder="VD: Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            label="Ngày sinh"
            name="date_of_birth"
            rules={[{ required: true, message: "Chọn ngày sinh" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày sinh"
            />
          </Form.Item>

          <Form.Item
            label="Giới tính"
            name="gender"
            rules={[{ required: true, message: "Chọn giới tính" }]}
          >
            <Select
              placeholder="Chọn giới tính"
              options={[
                { value: "Nam", label: "Nam" },
                { value: "Nữ", label: "Nữ" },
                { value: "Khác", label: "Khác" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Điện thoại"
            name="phone"
            rules={[{ required: true, message: "Nhập số điện thoại" }]}
          >
            <Input placeholder="VD: 0912345678" />
          </Form.Item>

          <Form.Item
            label="Địa chỉ"
            name="address"
            rules={[{ required: true, message: "Nhập địa chỉ" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập địa chỉ khách hàng"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
