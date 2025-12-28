// src/components/dashboard/SalesOverviewCard.jsx
import { Card } from "antd";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const SalesOverviewCard = ({ data }) => {
  return (
    <Card
      className="dashboard-card"
      title="Sales Overview"
      extra={<span style={{ fontSize: 12 }}>Sales vs Revenue</span>}
    >
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              name="Sales"
              stroke="#4aa3ff"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default SalesOverviewCard;
