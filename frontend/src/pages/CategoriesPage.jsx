// src/pages/CategoriesPage.jsx
import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Modal, Space, Table, message } from "antd";
import { listCategories, getCategory, createCategory, updateCategory, deleteCategory } from "../services/categoryApi";

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await listCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
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
      description: record.description,
    });
    setModalOpen(true);
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: "Xoá danh mục",
      content: `Bạn chắc chắn muốn xoá "${record.name}"?`,
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await deleteCategory(record.id);
          message.success("Đã xoá");
          fetchCategories();
        } catch (err) {
          console.error(err);
          message.error("Xoá thất bại");
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await updateCategory(editing.id, values);
        message.success("Cập nhật danh mục thành công");
      } else {
        await createCategory(values);
        message.success("Thêm danh mục thành công");
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchCategories();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Lưu danh mục thất bại");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
    },
    {
      title: "Tên danh mục",
      dataIndex: "name",
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      ellipsis: true,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      render: (_text, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            Sửa
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record)}>
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Danh mục</h1>
        <p className="dashboard-subtitle">Quản lý danh mục sản phẩm</p>
      </div>

      <Card
        className="dashboard-card"
        title="Danh sách danh mục"
        extra={
          <Button type="primary" onClick={openCreate}>
            + Thêm danh mục
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={categories}
        />
      </Card>

      <Modal
        title={editing ? "Cập nhật danh mục" : "Thêm danh mục"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editing ? "Cập nhật" : "Thêm mới"}
        cancelText="Huỷ"
        destroyOnClose
        forceRender
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Tên danh mục"
            name="name"
            rules={[{ required: true, message: "Nhập tên danh mục" }]}
          >
            <Input placeholder="Ví dụ: Đồ gia dụng, điện tử, thực phẩm..." />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Mô tả thêm về danh mục"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
