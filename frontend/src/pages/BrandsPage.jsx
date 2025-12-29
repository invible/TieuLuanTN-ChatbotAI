// src/pages/BrandsPage.jsx
import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Modal, Space, Table, message } from "antd";
import { listBrands } from "../services/brandApi";

const BrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const loadBrands = async () => {
    try {
      setLoading(true);
      const res = await listBrands();
      setBrands(res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được thương hiệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
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
      origin: record.origin,
    });
    setModalOpen(true);
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: "Xoá thương hiệu",
      content: `Bạn chắc chắn muốn xoá "${record.name}"?`,
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/brands/${record.id}`);
          message.success("Đã xoá");
          loadBrands();
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
        await axios.put(`${API_BASE_URL}/brands/${editing.id}`, values);
        message.success("Cập nhật thương hiệu thành công");
      } else {
        await axios.post(`${API_BASE_URL}/brands/`, values);
        message.success("Thêm thương hiệu thành công");
      }
      setModalOpen(false);
      loadBrands();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Lưu thương hiệu thất bại");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
    },
    {
      title: "Tên thương hiệu",
      dataIndex: "name",
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: "Xuất xứ",
      dataIndex: "origin",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
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

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Thương hiệu</h1>
        <p className="dashboard-subtitle">Quản lý thương hiệu sản phẩm</p>
      </div>

      <Card
        className="dashboard-card"
        title="Danh sách thương hiệu"
        extra={
          <Button type="primary" onClick={openCreate}>
            + Thêm thương hiệu
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={brands}
        />
      </Card>

      <Modal
        title={editing ? "Cập nhật thương hiệu" : "Thêm thương hiệu"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText="Lưu"
        destroyOnClose
      >
        <Form layout="vertical" form={form} preserve={false}>
          <Form.Item
            label="Tên thương hiệu"
            name="name"
            rules={[{ required: true, message: "Nhập tên thương hiệu" }]}
          >
            <Input placeholder="Ví dụ: Omron, Philips, Roche..." />
          </Form.Item>

          <Form.Item
            label="Xuất xứ"
            name="origin"
            rules={[{ required: true, message: "Nhập xuất xứ" }]}
          >
            <Input placeholder="Ví dụ: Nhật Bản, Đức, Việt Nam..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BrandsPage;
