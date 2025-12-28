// src/pages/ProductsPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Table,
  Tag,
  Space,
  Input,
  Modal,
  Form,
  InputNumber,
  message,
  Tooltip,
  Select,
  Upload,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productApi";
import { listCategories } from "../services/categoryApi";
import { listBrands } from "../services/brandApi";
import { uploadProductImage } from "../services/productApi";

const { Search } = Input;

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  // state cho upload nhiều ảnh
  const [imageFileList, setImageFileList] = useState([]);

  // ====== Load data ======
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await listProducts();
      setProducts(res.data || []);
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      message.error("Không tải được danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await listCategories();
      const data = Array.isArray(res) ? res : res?.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await listBrands();
      const data = Array.isArray(res) ? res : res?.data;
      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải thương hiệu:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  // map id -> name để hiển thị tên trong bảng
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const brandMap = useMemo(() => {
    const map = new Map();
    brands.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [brands]);

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [categories]
  );

  const brandOptions = useMemo(
    () =>
      brands.map((b) => ({
        value: b.id,
        label: b.name,
      })),
    [brands]
  );

  // ====== Modal mở / đóng ======
  const openCreateModal = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      stock: 0,
    });
    setImageFileList([]); // reset list ảnh
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingProduct(record);

    form.setFieldsValue({
      name: record.name,
      description: record.description,
      unit: record.unit,
      packaging: record.packaging,
      image_url: record.image_url,
      purchase_price: Number(record.purchase_price),
      selling_price: Number(record.selling_price),
      stock: Number(record.stock),
      category_id: record.category_id ?? null,
      brand_id: record.brand_id ?? null,
    });

    // nếu có image_url thì tạo sẵn 1 file trong Upload để preview
    const initialFiles = [];
    if (record.image_url) {
      initialFiles.push({
        uid: "-1",
        name: "image",
        status: "done",
        url: record.image_url,
      });
    }
    setImageFileList(initialFiles);

    setIsModalOpen(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Xoá sản phẩm?",
      content: `Bạn chắc chắn muốn xoá "${record.name}"?`,
      okText: "Xoá",
      cancelText: "Huỷ",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteProduct(record.id);
          message.success("Đã xoá sản phẩm");
          fetchProducts();
        } catch (error) {
          console.error("Lỗi xoá sản phẩm:", error);
          message.error("Không xoá được sản phẩm");
        }
      },
    });
  };

  // ====== Upload ảnh: chỉ xử lý UI + lưu đường dẫn tạm vào image_url ======
  const handleUploadChange = ({ fileList }) => {
    setImageFileList(fileList);

    // Lấy ảnh đầu tiên làm "ảnh đại diện" -> lưu vào image_url
    const first = fileList[0];
    if (first) {
      const url = first.url || first.thumbUrl || "";
      form.setFieldsValue({ image_url: url });
    } else {
      form.setFieldsValue({ image_url: null });
    }
  };

  const handleSubmit = async (values) => {
    const payload = {
      name: values.name,
      description: values.description,
      unit: values.unit,
      packaging: values.packaging,
      // tạm thời dùng image_url (ảnh đầu tiên / base64) – backend có thể tuỳ chỉnh để lưu file thật
      image_url: values.image_url,
      purchase_price: Number(values.purchase_price),
      selling_price: Number(values.selling_price),
      stock: Number(values.stock ?? 0),
      category_id: values.category_id ? Number(values.category_id) : null,
      brand_id: values.brand_id ? Number(values.brand_id) : null,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        message.success("Cập nhật sản phẩm thành công");
      } else {
        await createProduct(payload);
        message.success("Thêm sản phẩm thành công");
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      form.resetFields();
      setImageFileList([]);
      fetchProducts();
    } catch (error) {
      console.error("Lỗi lưu sản phẩm:", error);
      message.error("Không lưu được sản phẩm");
    }
  };

  // ====== Filter search ======
  const filteredProducts = useMemo(() => {
    if (!searchText) return products;
    const text = searchText.toLowerCase();
    return products.filter(
      (p) =>
        String(p.id).includes(text) ||
        p.name?.toLowerCase().includes(text) ||
        p.description?.toLowerCase().includes(text)
    );
  }, [products, searchText]);

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
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (_, record) => {
        const hasImage = !!record.image_url;
        return (
          <Tooltip
            title={
              hasImage ? (
                <img
                  src={record.image_url}
                  alt={record.name}
                  style={{ maxWidth: 200, maxHeight: 200, display: "block" }}
                />
              ) : (
                "Không có ảnh"
              )
            }
          >
            <strong
              style={{
                cursor: hasImage ? "pointer" : "default",
              }}
            >
              {record.name}
            </strong>
          </Tooltip>
        );
      },
    },
        {
      title: "Danh mục",
      dataIndex: "category_id",
      key: "category_id",
      width: 150,
      render: (_, record) => {
        const name =
          record.category?.name ||
          categoryMap.get(record.category_id) ||
          null;
        return name ? <span>{name}</span> : <Tag>Chưa gán</Tag>;
      },
    },
    {
      title: "Thương hiệu",
      dataIndex: "brand_id",
      key: "brand_id",
      width: 150,
      render: (_, record) => {
        const name =
          record.brand?.name || brandMap.get(record.brand_id) || null;
        return name ? <span>{name}</span> : <Tag>Chưa gán</Tag>;
      },
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      width: 100,
    },
    {
      title: "Giá nhập (VND)",
      dataIndex: "purchase_price",
      key: "purchase_price",
      align: "right",
      render: (value) => `${Number(value).toLocaleString()}`,
      sorter: (a, b) =>
        Number(a.purchase_price) - Number(b.purchase_price),
    },
    {
      title: "Giá bán (VND)",
      dataIndex: "selling_price",
      key: "selling_price",
      align: "right",
      render: (value) => `${Number(value).toLocaleString()}`,
      sorter: (a, b) =>
        Number(a.selling_price) - Number(b.selling_price),
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      key: "stock",
      align: "center",
      render: (value) =>
        value > 10 ? (
          <Tag color="green">{value}</Tag>
        ) : value > 0 ? (
          <Tag color="orange">{value}</Tag>
        ) : (
          <Tag color="red">Hết hàng</Tag>
        ),
      sorter: (a, b) => a.stock - b.stock,
    },

    {
      title: "Thao tác",
      key: "action",
      align: "right",
      width: 150,
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
    <Card
      title="Quản lý sản phẩm"
      extra={
        <Space>
          <Search
            placeholder="Tìm theo tên, mô tả..."
            allowClear
            onSearch={(value) => setSearchText(value)}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
            prefix={<SearchOutlined />}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Thêm sản phẩm
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        dataSource={filteredProducts}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title={editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
          setImageFileList([]);
        }}
        onOk={() => form.submit()}
        okText={editingProduct ? "Cập nhật" : "Thêm mới"}
        cancelText="Huỷ"
        destroyOnClose
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Tên sản phẩm"
            name="name"
            rules={[{ required: true, message: "Nhập tên sản phẩm" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: "Nhập mô tả" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="Đơn vị tính"
            name="unit"
            rules={[
              {
                required: true,
                message: "Nhập đơn vị tính (cái, hộp,...)",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Quy cách" name="packaging">
            <Input />
          </Form.Item>

          {/* Upload nhiều ảnh + preview */}
          <Form.Item label="Hình ảnh sản phẩm" required>
            <Upload
              listType="picture-card"
              fileList={imageFileList}
              multiple={false} // nếu chỉ cần 1 ảnh đại diện
              customRequest={async ({ file, onSuccess, onError }) => {
                try {
                  const res = await uploadProductImage(file); // bạn tự viết service
                  const url = res?.data?.url;

                  form.setFieldsValue({ image_url: url });

                  setImageFileList([
                    { uid: "-1", name: file.name, status: "done", url },
                  ]);

                  onSuccess?.("ok");
                } catch (err) {
                  onError?.(err);
                  message.error("Upload ảnh thất bại");
                }
              }}
              onChange={({ fileList }) => setImageFileList(fileList)}
            >
              {imageFileList.length ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Tải ảnh</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          {/* field ẩn để lưu đường dẫn ảnh đầu tiên (hoặc base64) */}
          <Form.Item name="image_url" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Giá nhập (VND)"
            name="purchase_price"
            rules={[{ required: true, message: "Nhập giá nhập" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={1000}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/(,|\s)/g, "")}
            />
          </Form.Item>

          <Form.Item
            label="Giá bán (VND)"
            name="selling_price"
            rules={[{ required: true, message: "Nhập giá bán" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={1000}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/(,|\s)/g, "")}
            />
          </Form.Item>

          <Form.Item label="Tồn kho" name="stock" initialValue={0}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item label="Danh mục" name="category_id">
            <Select
              allowClear
              placeholder="Chọn danh mục"
              options={categoryOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item label="Thương hiệu" name="brand_id">
            <Select
              allowClear
              placeholder="Chọn thương hiệu"
              options={brandOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ProductsPage;
