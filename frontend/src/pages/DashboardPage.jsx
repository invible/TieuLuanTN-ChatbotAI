import { useEffect, useState } from 'react';
import { getDashboardOverview } from "../services/dashboardApi";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  List,
  Avatar,
  Tag,
  Table,
} from 'antd';
import { 
  ShoppingCartOutlined, 
  UserAddOutlined, 
  HistoryOutlined 
} from '@ant-design/icons';
import '../styles/dashboard.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDashboardOverview();
        setOverview(data);
      } catch (err) {
        console.error('Không tải được dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

const { Text } = Typography;

const stats = overview?.stats ?? {}
const sales = overview?.sales_overview ?? [];
const traffic = overview?.traffic_sources ?? [];
const activities = overview?.recent_activities ?? [];
const products = overview?.top_products ?? [];

const aov = stats.sales > 0 ? stats.revenue / stats.sales : 0;

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { 
        usePointStyle: true,
        padding: 20,
        font: { size: 12, weight: '600' }
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#000',
      bodyColor: '#666',
      borderColor: '#dfdfdf',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: { display: false },
    },
    ySales: {
      type: 'linear',
      position: 'left',
      beginAtZero: true,
      ticks: { color: '#ff4d4f' }
    },
    yRevenue: {
      type: 'linear',
      position: 'right',
      beginAtZero: true,
      grid: { drawOnChartArea: false },
      ticks: {
        color: '#1890ff',
        callback: (value) => {
          if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' tỷ';
          if (value >= 1000000) return (value / 1000000).toFixed(0) + ' triệu';
          return value.toLocaleString('vi-VN') + ' đ';
        },
      },
    },
  },
};

const lineData = {
  labels: (sales ?? []).map((item) => item.month),
  datasets: [
    {
      label: "Đơn hàng",
      data: (sales ?? []).map((item) => item.sales),
      borderColor: "#ff4d4f",      // Màu đỏ (Danger/Hot)
      backgroundColor: "#ff4d4f",
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
      yAxisID: 'ySales',
      fill: false,                 // Giữ dạng đường mảnh để không đè lên doanh thu
    },
    {
      label: "Doanh thu",
      data: (sales ?? []).map((item) => item.revenue),
      borderColor: "#1890ff",      // Màu xanh Blue (Trust/Primary)
      backgroundColor: "rgba(24, 144, 255, 0.1)", // Hiệu ứng đổ bóng nhẹ phía dưới
      borderWidth: 2,
      pointRadius: 0,              // Ẩn điểm nút để nhìn mượt hơn
      tension: 0.4,
      fill: true,                  // Tạo vùng màu để phân biệt với đường đơn hàng
      yAxisID: 'yRevenue', 
    },
  ],
};

const doughnutData = {
  labels: (traffic ?? []).map((t) => t.name),
  datasets: [
    {
      data: (traffic ?? []).map((t) => t.value),
      backgroundColor: ['#3f51b5', '#00bcd4', '#ff9800', '#4caf50', '#f44336', '#9c27b0'],
      borderWidth: 0,
    },
  ],
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    // Kích hoạt plugin cục bộ ở đây
    datalabels: {
      display: true,
      color: '#fff',
      formatter: (value, ctx) => {
        const datasets = ctx.chart.data.datasets;
        if (datasets.indexOf(ctx.dataset) === datasets.length - 1) {
          const sum = datasets[0].data.reduce((a, b) => a + b, 0);
          const percentage = ((value / sum) * 100).toFixed(1) + "%";
          return percentage;
        }
        return null;
      },
    },
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 15,
        // Thủ thuật để chia cột: giới hạn chiều rộng của box label
        boxWidth: 10,
      },
    },
  },
};

const productColumns = [
  {
    title: 'STT',
    key: 'index',
    width: 60,
    align: 'center',
    render: (text, record, index) => {
      // Mảng màu sắc cho 5 vị trí đầu tiên
      const colors = ['#ff4d4f', '#faad14', '#52c41a', '#1890ff', '#722ed1'];
      return (
        <Avatar 
          size="small" 
          style={{ 
            backgroundColor: colors[index] || '#bfbfbf',
            fontWeight: 'bold' 
          }}
        >
          {index + 1}
        </Avatar>
      );
    },
  },
  {
    title: 'Tên sản phẩm',
    dataIndex: 'product',
    key: 'product',
    render: (text) => <span>{text}</span>, // Bỏ Avatar cũ ở đây
  },
  {
    title: 'Số lượng đã bán',
    dataIndex: 'sales',
    key: 'sales',
    align: 'center',
    render: (sales) => (
      <div style={{ width: '100%' }}>
        <div style={{ marginBottom: 4 }}>{sales.toLocaleString()}</div>
        {/* Thanh tiến độ để giao diện đẹp hơn */}
        <div style={{ 
          height: 4, 
          width: '100%', 
          backgroundColor: '#f5f5f5', 
          borderRadius: 2 
        }}>
          <div style={{ 
            height: '100%', 
            width: `${Math.min((sales / 1000) * 100, 100)}%`, 
            backgroundColor: '#52c41a', 
            borderRadius: 2 
          }} />
        </div>
      </div>
    ),
  },
  {
    title: 'Doanh thu',
    dataIndex: 'revenue',
    key: 'revenue',
    align: 'right',
    render: (value) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
  },
  {
    title: 'Tình trạng',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    render: (status) => {
      let color = 'green';
      if (status === 'Low Stock') color = 'orange';
      if (status === 'Out of Stock') color = 'red';
      return <Tag color={color} style={{ borderRadius: 10 }}>{status}</Tag>;
    },
  },
];

  return (
    <div className="dashboard-wrapper">
      {/* top stat cards */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card stat-card-green">
            <Statistic title="TỔNG DOANH THU" value={stats?.revenue?.toLocaleString('vi-VN')} suffix="VNĐ" />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card stat-card-purple">
            <Statistic title="TỔNG ĐƠN HÀNG" value={stats?.sales?.toLocaleString('vi-VN')} />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card stat-card-orange">
            <Statistic title="GIÁ TRỊ TRUNG BÌNH ĐƠN (AOV)" value={Math.round(aov).toLocaleString('vi-VN')} suffix="VNĐ"/>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card stat-card-blue">
            <Statistic title="TỔNG KHÁCH HÀNG" value={stats.customers} precision={0} />
          </Card>
        </Col>
      </Row>

      {/* charts row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Tổng quan bán hàng trong 12 tháng qua">
            <div style={{ width: '100%', height: 350 }}>
              <Line options={lineOptions} data={lineData} />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Doanh thu theo danh mục" className="category-card">
            <div style={{ width: '100%', height: 350, position: 'relative' }}>
              <Doughnut 
                data={doughnutData} 
                options={doughnutOptions} 
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* bottom row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Hoạt động gần đây">
            <List
              itemLayout="horizontal"
              dataSource={activities ?? []}
              renderItem={(item) => {
                // Logic xác định Icon và màu sắc dựa trên tiêu đề
                const isOrder = item.title.includes("Đơn hàng");
                const isCustomer = item.title.includes("Khách hàng");

                return (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ 
                            backgroundColor: isOrder ? '#e6f7ff' : (isCustomer ? '#f6ffed' : '#f5f5f5'),
                            color: isOrder ? '#1890ff' : (isCustomer ? '#52c41a' : '#bfbfbf'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          icon={isOrder ? <ShoppingCartOutlined /> : (isCustomer ? <UserAddOutlined /> : <HistoryOutlined />)}
                        />
                      }
                      title={<Text strong>{item.title}</Text>}
                      description={
                        <>
                          <div>{item.description}</div>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {item.time}
                          </Text>
                        </>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Sản phẩm bán chạy">
            <Table
              columns={productColumns}
              dataSource={products ?? []}
              pagination={false}
              size="small"
              rowKey="key"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;