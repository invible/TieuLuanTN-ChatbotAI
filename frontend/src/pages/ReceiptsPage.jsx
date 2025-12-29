// src/pages/ReceiptsPage.jsx
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";

import { createReceipt, deleteReceipt, listReceipts, getReceipt, updateReceipt } from "../services/receiptApi";
import { listProducts } from "../services/productApi";
import { listSuppliers } from "../services/supplierApi";

const statusColors = {
  completed: "green",
  pending: "gold",
  cancelled: "red",
};

const ReceiptsPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [form] = Form.useForm();

  // ====== Load data list ======
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await listReceipts();
      setReceipts(res.data || []);
    } catch (err) {
      console.error("Lỗi tải phiếu nhập:", err);
      message.error("Không tải được danh sách phiếu nhập");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await listSuppliers();
      const data = Array.isArray(res) ? res : res?.data;
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await listProducts();
      const data = Array.isArray(res) ? res : res?.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchSuppliers();
    fetchProducts();
  }, []);

  // ====== API lấy chi tiết 1 phiếu nhập (kèm receipt_items) ======
  const fetchReceiptDetail = async (id) => {
    const res = await getReceipt(id);
    return res.data;
  };

  // ====== Helpers ======
  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const getSupplierName = (receipt) => {
    if (receipt.suppliers?.name) return receipt.suppliers.name;
    if (receipt.supplier?.name) return receipt.supplier.name;
    if (receipt.supplier_name) return receipt.supplier_name;
    return "";
  };

  const computeReceiptTotal = (receipt) => {
    const items = receipt.receipt_items || receipt.items || [];
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unit_price || 0);
      return sum + qty * price;
    }, 0);
  };

  // ====== Modal mở/đóng ======
  const openCreateModal = () => {
    setEditingReceipt(null);
    setModalOpen(true);
    form.resetFields();
    form.setFieldsValue({
      create_date: dayjs(),
      status: "completed",
      items: [
        {
          product_id: undefined,
          quantity: 1,
          unit_price: 0,
        },
      ],
    });
  };

  const openEditModal = async (record) => {
    try {
      setModalOpen(true);
      // lấy chi tiết phiếu nhập từ backend
      const data = await fetchReceiptDetail(record.id);

      const rawItems = data.receipt_items || data.items || [];
      const items = rawItems.map((it) => ({
        product_id: it.product_id,
        quantity: Number(it.quantity || 0),
        unit_price: Number(it.unit_price || 0),
      }));

      setEditingReceipt(data);

      // giống OrdersPage: setFieldsValue TRƯỚC rồi mở modal
      form.setFieldsValue({
        create_date: data.create_date ? dayjs(data.create_date) : null,
        approval_date: data.approval_date
          ? dayjs(data.approval_date)
          : null,
        approval_person: data.approval_person || "",
        note: data.note || "",
        status: data.status || "completed",
        supplier_id: data.supplier_id || data.suppliers?.id,
        user_id: data.user_id ?? 1,
        items: items.length
          ? items
          : [
              {
                product_id: undefined,
                quantity: 1,
                unit_price: 0,
              },
            ],
      });

    } catch (err) {
      console.error(err);
      message.error("Không tải được chi tiết phiếu nhập");
    }
  };

  // ====== Xoá phiếu nhập ======
  const handleDelete = (record) => {
    Modal.confirm({
      title: "Xoá phiếu nhập",
      content: `Bạn chắc chắn muốn xoá phiếu nhập #${record.id}?`,
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await deleteReceipt(record.id);
          message.success("Đã xoá phiếu nhập");
          fetchReceipts();
        } catch (err) {
          console.error(err);
          message.error("Xoá phiếu nhập thất bại");
        }
      },
    });
  };

  // ====== Submit form (giống OrdersPage: dùng onFinish) ======
  const handleSubmit = async (values) => {
    const payload = {
      create_date: values.create_date
        ? values.create_date.toISOString()
        : null,
      approval_date: values.approval_date
        ? values.approval_date.toISOString()
        : null,
      approval_person: values.approval_person || null,
      note: values.note || null,
      status: values.status || "completed",
      supplier_id: Number(values.supplier_id),
      user_id: Number(values.user_id || 1),
      items: (values.items || []).map((it) => ({
        product_id: Number(it.product_id),
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
      })),
    };

    try {
      if (editingReceipt) {
        await updateReceipt(editingReceipt.id, payload);
        message.success("Cập nhật phiếu nhập thành công");
      } else {
        await createReceipt(payload);
        message.success("Thêm phiếu nhập thành công");
      }

      setModalOpen(false);
      setEditingReceipt(null);
      form.resetFields();
      await fetchReceipts();
    } catch (err) {
      console.error("Lỗi submit:", err);
      message.error("Lưu phiếu nhập thất bại");
    }
  };

  // ====== Columns ======
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Ngày tạo",
      dataIndex: "create_date",
      key: "create_date",
      render: (value) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "",
    },
    {
      title: "Nhà cung cấp",
      key: "supplier",
      render: (_, record) => getSupplierName(record),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (value) => {
        const color = statusColors[value] || "default";
        return <Tag color={color}>{value || "completed"}</Tag>;
      },
    },
    {
      title: "Tổng giá trị",
      key: "total",
      align: "right",
      render: (_, record) =>
        computeReceiptTotal(record).toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(record)}>
            Xem / Sửa
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
        <h1 className="dashboard-title">Nhập kho</h1>
        <p className="dashboard-subtitle">Quản lý phiếu nhập kho</p>
      </div>

      <Card
        className="dashboard-card"
        title="Danh sách phiếu nhập"
        extra={
          <Button type="primary" onClick={openCreateModal}>
            + Thêm phiếu nhập
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={receipts}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/* Modal tạo / sửa phiếu nhập */}
      <Modal
        title={editingReceipt ? "Cập nhật phiếu nhập" : "Thêm phiếu nhập"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingReceipt(null);
        }}
        onOk={() => form.submit()}
        okText="Lưu"
        width={900}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{
            status: "completed",
          }}
          onFinish={handleSubmit}
        >
          <div className="dashboard-row" style={{ marginBottom: 16 }}>
            <div>
              <Form.Item
                label="Ngày tạo"
                name="create_date"
                rules={[
                  { required: true, message: "Chọn ngày tạo phiếu" },
                ]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div>

            <div>
              <Form.Item
                label="Nhà cung cấp"
                name="supplier_id"
                rules={[
                  { required: true, message: "Chọn nhà cung cấp" },
                ]}
              >
                <Select
                  placeholder="Chọn nhà cung cấp"
                  options={supplierOptions}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </div>

            <div>
              <Form.Item label="Trạng thái" name="status">
                <Select
                  options={[
                    { value: "completed", label: "Hoàn tất" },
                    { value: "pending", label: "Đang chờ" },
                    { value: "cancelled", label: "Đã huỷ" },
                  ]}
                />
              </Form.Item>
            </div>
          </div>

          <div className="dashboard-row" style={{ marginBottom: 16 }}>
            {/* <div>
              <Form.Item label="Người duyệt" name="approval_person">
                <Input placeholder="Tên người duyệt (nếu có)" />
              </Form.Item>
            </div> */}
            {/* <div>
              <Form.Item label="Ngày duyệt" name="approval_date">
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div> */}
          </div>

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={2} placeholder="Ghi chú phiếu nhập" />
          </Form.Item>

          <Card
            size="small"
            title="Chi tiết phiếu nhập"
            style={{ marginTop: 8 }}
            extra={
              <Form.List name="items">
                {(fields, { add }) => (
                  <Button
                    type="dashed"
                    onClick={() =>
                      add({
                        product_id: undefined,
                        quantity: 1,
                        unit_price: 0,
                      })
                    }
                  >
                    + Thêm dòng
                  </Button>
                )}
              </Form.List>
            }
          >
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  <Table
                    pagination={false}
                    rowKey={(field) => field.key}
                    dataSource={fields}
                    columns={[
                      {
                        title: "Sản phẩm",
                        dataIndex: "product_id",
                        render: (_, field) => (
                          <Form.Item
                            name={[field.name, "product_id"]}
                            fieldKey={[field.fieldKey, "product_id"]}
                            rules={[
                              { required: true, message: "Chọn sản phẩm" },
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              placeholder="Chọn sản phẩm"
                              options={productOptions}
                              showSearch
                              optionFilterProp="label"
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: "Số lượng",
                        dataIndex: "quantity",
                        width: 120,
                        render: (_, field) => (
                          <Form.Item
                            name={[field.name, "quantity"]}
                            fieldKey={[field.fieldKey, "quantity"]}
                            rules={[
                              { required: true, message: "Nhập số lượng" },
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber min={1} style={{ width: "100%" }} />
                          </Form.Item>
                        ),
                      },
                      {
                        title: "Đơn giá (VND)",
                        dataIndex: "unit_price",
                        width: 160,
                        render: (_, field) => (
                          <Form.Item
                            name={[field.name, "unit_price"]}
                            fieldKey={[field.fieldKey, "unit_price"]}
                            rules={[
                              { required: true, message: "Nhập đơn giá" },
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              min={0}
                              step={1000}
                              style={{ width: "100%" }}
                              formatter={(value) =>
                                `${value}`.replace(
                                  /\B(?=(\d{3})+(?!\d))/g,
                                  ","
                                )
                              }
                              parser={(value) =>
                                value ? value.replace(/,/g, "") : "0"
                              }
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: "",
                        dataIndex: "actions",
                        width: 60,
                        render: (_, field) => (
                          <Button
                            danger
                            type="link"
                            onClick={() => remove(field.name)}
                          >
                            Xoá
                          </Button>
                        ),
                      },
                    ]}
                  />

                  {/* Tính tổng ngay trong form, không dùng useMemo + getFieldValue nữa */}
                  <Form.Item shouldUpdate>
                    {({ getFieldValue }) => {
                      const items = getFieldValue("items") || [];
                      const total = items.reduce((sum, it) => {
                        const qty = Number(it?.quantity || 0);
                        const price = Number(it?.unit_price || 0);
                        return sum + qty * price;
                      }, 0);

                      return (
                        <div
                          style={{
                            marginTop: 12,
                            textAlign: "right",
                            fontWeight: 600,
                          }}
                        >
                          Tổng tạm tính:{" "}
                          {total.toLocaleString("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      );
                    }}
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Card>
        </Form>
      </Modal>
    </div>
  );
};

export default ReceiptsPage;
