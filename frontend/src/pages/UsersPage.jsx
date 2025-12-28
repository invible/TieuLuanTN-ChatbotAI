// src/pages/UsersPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Tag,
  message,
  Space,
  Input,
  Button,
  Modal,
  Form,
  DatePicker,
  Select,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userApi";

const { Search } = Input;

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await listUsers();
      setUsers(res.data || []);
    } catch (error) {
      console.error("Lỗi tải người dùng:", error);
      message.error("Không tải được danh sách người dùng");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      status: "active",
      role: "staff",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      date_of_birth: record.date_of_birth
        ? dayjs(record.date_of_birth)
        : null,
      gender: record.gender,
      address: record.address,
      phone: record.phone,
      email: record.email,
      role: record.role,
      status: record.status,
      password: "", // không hiển thị password cũ
    });
    setIsModalOpen(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Xoá người dùng?",
      content: `Bạn chắc chắn muốn xoá user "${record.username}"?`,
      okText: "Xoá",
      cancelText: "Huỷ",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteUser(record.id);
          message.success("Đã xoá người dùng");
          fetchUsers();
        } catch (error) {
          console.error("Lỗi xoá người dùng:", error);
          message.error("Không xoá được người dùng");
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    const payload = {
      username: values.username,
      date_of_birth: values.date_of_birth
        ? values.date_of_birth.format("YYYY-MM-DD")
        : null,
      gender: values.gender,
      address: values.address,
      phone: values.phone,
      email: values.email,
      role: values.role,
      status: values.status || "active",
    };

    // chỉ gửi password nếu tạo mới hoặc user nhập password mới
    if (!editingUser || values.password) {
      payload.password = values.password;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, payload);
        message.success("Cập nhật người dùng thành công");
      } else {
        await createUser(payload);
        message.success("Thêm người dùng thành công");
      }
      setIsModalOpen(false);
      setEditingUser(null);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      console.error("Lỗi lưu người dùng:", error);
      message.error("Không lưu được người dùng");
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchText) return users;
    const text = searchText.toLowerCase();
    return users.filter((u) => {
      return (
        String(u.id).includes(text) ||
        u.username?.toLowerCase().includes(text) ||
        u.email?.toLowerCase().includes(text) ||
        u.phone?.toLowerCase().includes(text) ||
        u.role?.toLowerCase().includes(text) ||
        u.status?.toLowerCase().includes(text)
      );
    });
  }, [users, searchText]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "SĐT",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={role === "admin" ? "red" : "blue"}>{role}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "active" ? (
          <Tag color="green">active</Tag>
        ) : (
          <Tag color="default">inactive</Tag>
        ),
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      width: 100,
    },
    {
      title: "Ngày sinh",
      dataIndex: "date_of_birth",
      key: "date_of_birth",
      render: (value) =>
        value ? dayjs(value).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right",
      width: 170,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          >
            Sửa
          </Button>
          <Button
            icon={<DeleteOutlined />}
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

  return (
    <>
      <Card
        title="Quản lý người dùng"
        extra={
          <Space>
            <Search
              placeholder="Tìm theo username, email, SĐT..."
              allowClear
              onSearch={(v) => setSearchText(v)}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 320 }}
              prefix={<SearchOutlined />}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Thêm người dùng
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          dataSource={filteredUsers}
          columns={columns}
          loading={loadingUsers}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={editingUser ? "Cập nhật người dùng" : "Thêm người dùng"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onOk={() => form.submit()}
        okText={editingUser ? "Cập nhật" : "Thêm mới"}
        cancelText="Huỷ"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Nhập username" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Ngày sinh"
            name="date_of_birth"
            rules={[{ required: true, message: "Chọn ngày sinh" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            label="Giới tính"
            name="gender"
            rules={[{ required: true, message: "Chọn giới tính" }]}
          >
            <Select>
              <Select.Option value="Nam">Nam</Select.Option>
              <Select.Option value="Nữ">Nữ</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Địa chỉ"
            name="address"
            rules={[{ required: true, message: "Nhập địa chỉ" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[{ required: true, message: "Nhập số điện thoại" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={
              editingUser
                ? []
                : [{ required: true, message: "Nhập mật khẩu" }]
            }
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: "Chọn vai trò" }]}
          >
            <Select>
              <Select.Option value="admin">admin</Select.Option>
              <Select.Option value="staff">staff</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            initialValue="active"
          >
            <Select>
              <Select.Option value="active">active</Select.Option>
              <Select.Option value="inactive">inactive</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UsersPage;
