// src/components/dashboard/RecentActivityCard.jsx
import { Card, List } from "antd";

const RecentActivityCard = ({ activities }) => {
  return (
    <Card
      className="dashboard-card"
      title="Recent Activity"
      style={{ flex: 1.1 }}
    >
      <List
        itemLayout="horizontal"
        dataSource={activities}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#4aa3ff20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa fa-shopping-cart"
                    style={{ color: "#4aa3ff" }}
                  />
                </div>
              }
              title={<span>{item.title}</span>}
              description={
                <span>
                  {item.description}
                  <br />
                  <span style={{ fontSize: 11, color: "#9fb3c8" }}>
                    {item.time}
                  </span>
                </span>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default RecentActivityCard;
