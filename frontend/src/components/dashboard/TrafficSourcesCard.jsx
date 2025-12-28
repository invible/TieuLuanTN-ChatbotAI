// src/components/dashboard/TrafficSourcesCard.jsx
import { Card } from "antd";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

const COLORS = ["#3490dc", "#38c172", "#ff9f40"];

const TrafficSourcesCard = ({ data }) => {
  return (
    <Card
      className="dashboard-card"
      title="Traffic Sources"
      style={{ maxWidth: 420 }}
    >
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        {data.map((item, idx) => (
          <div key={item.name} style={{ fontSize: 12 }}>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: COLORS[idx % COLORS.length],
                marginRight: 6,
              }}
            />
            {item.name}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TrafficSourcesCard;
