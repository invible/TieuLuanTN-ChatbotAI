// src/components/dashboard/RevenueRangeCard.jsx
import { useState, useEffect } from "react";
import { Card, DatePicker, Button, message, Space } from "antd";
import { Line } from "react-chartjs-2";
import dayjs from "dayjs";
import { getRevenueRange } from "../../services/reportApi";

// ✅ ĐĂNG KÝ SCALE CHO CHART.JS (fix lỗi "category is not a registered scale")
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const { RangePicker } = DatePicker;

const RevenueRangeCard = ({ title = "Doanh thu theo khoảng ngày" }) => {
  const [range, setRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    if (!range || range.length !== 2 || !range[0] || !range[1]) {
      return;
    }

    const start = range[0].format("YYYY-MM-DD");
    const end = range[1].format("YYYY-MM-DD");

    try {
      setLoading(true);
      const res = await getRevenueRange(start, end);
      const data = res.data || [];

      const labels = data.map((d) => dayjs(d.date).format("DD/MM"));
      const values = data.map((d) => d.total);

      setChartData({
        labels,
        datasets: [
          {
            label: `Doanh thu từ ${range[0].format(
              "DD/MM"
            )} đến ${range[1].format("DD/MM")}`,
            data: values,
            tension: 0.35,
            fill: true,
            borderWidth: 2,
            borderColor: "rgba(22,119,255,1)",
            backgroundColor: "rgba(22,119,255,0.15)",
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      });
    } catch (err) {
      console.error(err);
      message.error("Không tải được dữ liệu doanh thu");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Tự load doanh thu tháng hiện tại khi mở Dashboard
  useEffect(() => {
    handleFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: { maxRotation: 0 } },
      y: { beginAtZero: true },
    },
  };

  return (
    <Card
      title={title}
      bordered={false}
      styles={{
        header: {
          borderRadius: "20px 20px 0 0",
          background:
            "linear-gradient(90deg, rgba(22,119,255,0.95), rgba(56,189,248,0.95))",
          color: "#fff",
          fontWeight: 600,
        },
        body: {
          padding: 16,
          background: "#ffffff",
          borderRadius: "0 0 20px 20px",
          height: 360,
        },
      }}
      extra={
        <Space>
          <RangePicker
            value={range}
            onChange={(values) => setRange(values)}
            allowClear={false}
            format="DD/MM/YYYY"
            size="small"
          />
          <Button
            type="primary"
            onClick={handleFetch}
            loading={loading}
            size="small"
          >
            Lọc
          </Button>
        </Space>
      }
      style={{
        borderRadius: 20,
        boxShadow: "0 12px 32px rgba(15,23,42,0.14)",
      }}
    >
      {chartData ? (
        <div style={{ height: "100%" }}>
          <Line data={chartData} options={options} />
        </div>
      ) : (
        <p>Đang tải dữ liệu doanh thu...</p>
      )}
    </Card>
  );
};

export default RevenueRangeCard;
