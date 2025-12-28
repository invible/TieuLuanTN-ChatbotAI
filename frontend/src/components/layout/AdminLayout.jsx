import { Layout, Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import ChatbotWidget from "../chat/ChatbotWidget";

const { Header, Sider, Content } = Layout;

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const selectedKey =
    location.pathname === "/" ? "/" : `/${location.pathname.split("/")[1]}`;

  const items = [
    { key: "/", label: <Link to="/">Dashboard</Link> },
    { key: "/products", label: <Link to="/products">Sản phẩm</Link> },
    { key: "/orders", label: <Link to="/orders">Đơn hàng</Link> },
    { key: "/users", label: <Link to="/users">Khách hàng</Link> },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div
          style={{
            height: 56,
            margin: 16,
            background: "rgba(255,255,255,0.2)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          Admin Shop
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0 }}>Bảng điều khiển quản trị</h3>
        </Header>
        <Content style={{ margin: "24px", minHeight: 280 }}>{children}</Content>

        {/* Chatbot popup, xuất hiện ở mọi trang */}
        <ChatbotWidget />
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
