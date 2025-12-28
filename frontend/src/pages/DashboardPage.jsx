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
  Filler
);

// Sample data for demonstration

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

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { usePointStyle: true },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  interaction: {
    mode: 'nearest',
    intersect: false,
  },
  scales: {
    x: {
      grid: { display: false },
    },
    ySales: {
      type: 'linear',
      position: 'left',
      beginAtZero: true,
      title: {
        display: true,
        text: 'Sales (quantity)',
      },
    },
    yRevenue: {
      type: 'linear',
      position: 'right',
      beginAtZero: true,
      grid: {
        drawOnChartArea: false, // không vẽ grid trùng lặp
      },
      ticks: {
        callback: (value) =>
          Number(value).toLocaleString(undefined, {
            maximumFractionDigits: 0,
          }),
      },
      title: {
        display: true,
        text: 'Revenue (VND)',
      },
    },
  },
};

const lineData = {
  labels: (sales ?? []).map((item) => item.month),
  datasets: [
    {
      label: "Sales",
      data: (sales ?? []).map((item) => item.sales),
      borderColor: "#00bcd4",
      backgroundColor: "rgba(0,188,212,0.15)",
      tension: 0.4,
      fill: true,
      yAxisID: 'ySales',
    },
    {
      label: "Revenue",
      data: (sales ?? []).map((item) => item.revenue),
      borderColor: "#3f51b5",
      backgroundColor: "rgba(63,81,181,0.15)",
      tension: 0.4,
      fill: true,
      yAxisID: 'yRevenue', 
    },
  ],
};

const doughnutData = {
  labels: (traffic ?? []).map((t) => t.name),
  datasets: [
    {
      data: (traffic ?? []).map((t) => t.value),
      backgroundColor: ['#3f51b5', '#00bcd4', '#ff9800'],
      borderWidth: 0,
    },
  ],
};

const productColumns = [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small">{text.charAt(0)}</Avatar>
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'Sales',
      dataIndex: 'sales',
      key: 'sales',
      align: 'right',
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (value) =>
      Number(value).toLocaleString("en-US")  // 👈 format
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => {
        let color = 'green';
        if (status === 'Low Stock') color = 'orange';
        if (status === 'Out of Stock') color = 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <div className="dashboard-wrapper">
      {/* top stat cards */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card stat-card-green">
            <Statistic title="REVENUE" value={stats.revenue} precision={0} suffix="VNĐ" />
            <div className="stat-footer">
              <Text type="success">↑ 12.5%</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card stat-card-purple">
            <Statistic title="SALES" value={stats.sales} precision={0} />
            <div className="stat-footer">
              <Text type="success">↑ 8.2%</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card stat-card-blue">
            <Statistic title="CUSTOMERS" value={stats.customers} precision={0} />
            <div className="stat-footer">
              <Text type="success">↑ 5.7%</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card stat-card-orange">
            <Statistic title="BOUNCE RATE" value={stats.bounce_rate} precision={1} suffix="%" />
            <div className="stat-footer">
              <Text type="danger">↓ 2.1%</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* charts row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Sales Overview">
            <div style={{ width: '100%', height: 300 }}>
              <Line options={lineOptions} data={lineData} />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Traffic Sources">
            <div style={{ width: '100%', height: 260 }}>
              <Doughnut data={doughnutData} options={doughnutData.labels} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* bottom row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Recent Activity">
            <List
              itemLayout="horizontal"
              dataSource={activities ?? []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: '#1890ff' }}>
                        {item.title.charAt(0)}
                      </Avatar>
                    }
                    title={item.title}
                    description={
                      <>
                        <div>{item.description}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.time}
                        </Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Top Products">
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
