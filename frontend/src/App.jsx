import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Input,
  Badge,
  Dropdown,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GiftOutlined,
  BellOutlined,
  UserOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from "./pages/CategoriesPage";
import BrandsPage from "./pages/BrandsPage";
import OrdersPage from './pages/OrdersPage';
import UsersPage from './pages/UsersPage';
import CustomersPage from "./pages/CustomersPage";
import ReceiptsPage from "./pages/ReceiptsPage";
import CheckoutPage from "./pages/CheckoutPage";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RequireAuth from "./components/RequireAuth";

import ChatWidget from "./components/chat/ChatbotWidget";

import { getDashboardOverview } from './services/dashboardApi';

import { MENU_ITEMS, MENU_USERS } from './config/menu.config';
import { getOpenKeysFromPath } from './utils/menu.helper';
import { logout, getUserFromToken } from "./services/authService";

const openKeys = getOpenKeysFromPath(location.pathname);
  
import './App.css';

const { Header, Sider, Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [user, setUser] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const res = await getDashboardOverview();
      setDashboardData(res.data || []);
    } catch (error) {
      console.error('Không tải được dashboard:', error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null); // Xóa user trong state để App biết đã đăng xuất
    navigate("/login", { replace: true });
  };

  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      handleLogout();
      return;
    }
    navigate(key);
  };

  useEffect(() => {
    const user_tk = getUserFromToken(); // Lấy user từ token trước
    if (!user_tk) {
      navigate("/login", { replace: true });
    } else {
      setUser(user_tk); // Chỉ set user nếu có token hợp lệ
    }
  }, [navigate, location.pathname]);

  const notifications = dashboardData?.recent_activities || [];
  
  return (
    <>
  <Routes>
    {/* PUBLIC ROUTES */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* PROTECTED APP */}
    <Route
      path="/*"
      element={
        <RequireAuth>
          <Layout style={{ minHeight: '100vh' }}>
            {/* ==== SIDEBAR ==== */}
            <Sider
              collapsible
              collapsed={collapsed}
              trigger={null}
              width={230}
              style={{ background: '#1f2533' }}
            >
              <div className="logo">
                <div className="logo-icon">HY</div>
                {!collapsed && <span className="logo-text">Shop Admin</span>}
              </div>

              <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[location.pathname]}
                defaultOpenKeys={openKeys}
                items={MENU_ITEMS}
                onClick={({ key }) => key.startsWith('/') && navigate(key)}
              />
            </Sider>

            {/* ==== MAIN ==== */}

      <Layout>
        <Header className="header">
          <div className="header-left">
            <span
              className="trigger"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <span className="header-title">Quản trị bán hàng - Bách hóa Hoàng Yến</span>
          </div>

          <div className="header-right">

          <Dropdown
            placement="bottomRight"
            trigger={['click']}
            dropdownRender={() => (
              <div className="notification-dropdown">
                <h4>Thông báo</h4>

                {notifications.length === 0 && (
                  <div className="notification-empty">
                    Không có thông báo mới
                  </div>
                )}

                {notifications.slice(0, 5).map((item, index) => (
                  <div key={index} className="notification-item">
                    <div className="notification-title">{item.title}</div>
                    <div className="notification-desc">{item.description}</div>
                    <div className="notification-time">{item.time}</div>
                  </div>
                ))}
              </div>
            )}
          >
            <Badge count={notifications.length} offset={[-2, 4]}>
              <BellOutlined className="header-icon" />
            </Badge>
          </Dropdown>

            <Dropdown
              menu={{ 
                items: MENU_USERS,
                onClick: handleMenuClick
              }}
              placement="bottomRight"
            >
              <div className="header-user">
                <Avatar size="small" icon={<UserOutlined />} />
                <span className="header-username" style={{ marginLeft: 8 }}>{user?.username || "User"}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="content">
                <Routes>
                  <Route
                    path="/dashboard"
                    element={
                      <DashboardPage
                        dashboardData={dashboardData}
                        loading={loadingDashboard}
                      />
                    }
                  />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/brands" element={<BrandsPage />} />
                  <Route path="/receipts" element={<ReceiptsPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route
                    path="/checkout"
                    element={<CheckoutPage onDashboardRefresh={fetchDashboard} />}
                  />
                </Routes>
              </Content>
            </Layout>

          </Layout>
        </RequireAuth>
      }
    />
  </Routes>
        <ChatWidget />
        </>
);
}

export default App;
