import React, { useState } from 'react';
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
  DashboardOutlined,
  ProductOutlined,
  TableOutlined,
  FormOutlined,
  GiftOutlined,
  BellOutlined,
  UserOutlined,
  SearchOutlined,
  FileTextOutlined
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

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import ChatWidget from "./components/chat/ChatbotWidget";
  
import './App.css';

const { Header, Sider, Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/products', icon: <ProductOutlined />, label: 'Products' },
    { key: '/categories', icon: <TableOutlined />, label: 'Categories' },
    { key: '/brands', icon: <TableOutlined />, label: 'Brands' },
    { key: '/receipts', icon: <FileTextOutlined  />, label: 'Receipts' },
    { key: '/orders', icon: <FormOutlined />, label: 'Orders' },
    { key: '/users', icon: <UserOutlined />, label: 'Users' },
    { key: '/customers', icon: <UserOutlined />, label: 'Customers' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={230}
        style={{ background: '#1f2533' }}
      >
        <div className="logo">
          <div className="logo-icon">E</div>
          {!collapsed && <span className="logo-text">E-ShopAdmin</span>}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={(info) => navigate(info.key)}
        />
      </Sider>

      <Layout>
        <Header className="header">
          <div className="header-left">
            <span
              className="trigger"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <span className="header-title">Dashboard</span>
          </div>

          <div className="header-right">
            <Input
              className="header-search"
              prefix={<SearchOutlined />}
              placeholder="Search..."
              size="small"
            />

            <Badge count={3} offset={[-2, 4]}>
              <BellOutlined className="header-icon" />
            </Badge>
            <Badge count={1} offset={[-2, 4]}>
              <GiftOutlined className="header-icon" />
            </Badge>

            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
            >
              <div className="header-user">
                <Avatar size="small" icon={<UserOutlined />} />
                <span className="header-username">Admin</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/receipts" element={<ReceiptsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/customers" element={<CustomersPage />} />
          </Routes>
        </Content>
      </Layout>
      <ChatWidget />
    </Layout>
  );
};

export default App;
