// src/components/dashboard/RevenueChart.jsx
import { useEffect, useState } from "react";
import { Card } from "antd";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { getRevenueByMonth } from "../../services/reportApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const RevenueChart = ({ year = new Date().getFullYear() }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getRevenueByMonth(year);
        const data = res.data || [];

        const labels = data.map((item) => `Tháng ${item.month}`);
        const values = data.map((item) => item.total);

        setChartData({
          labels,
          datasets: [
            {
              label: `Doanh thu năm ${year}`,
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
      } catch (error) {
        console.error("Lỗi load doanh thu:", error);
      }
    };

    fetchData();
  }, [year]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <Card
      title="Doanh thu theo tháng"
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
        <p>Đang tải dữ liệu...</p>
      )}
    </Card>
  );
};

export default RevenueChart;
