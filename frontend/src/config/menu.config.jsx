import {
  DashboardOutlined,
  ProductOutlined,
  FormOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  BoxPlotOutlined,
  UnorderedListOutlined,
  TagsOutlined,
  ImportOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';

import { Link } from "react-router-dom";

export const MENU_ITEMS = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    path: '/dashboard',
  },
  {
    key: 'product-management',
    icon: <ProductOutlined />,
    label: 'Quản lý sản phẩm',
    children: [
      {
        key: '/products',
        icon: <BoxPlotOutlined />,
        label: 'Sản phẩm',
        path: '/products',
      },
      {
        key: '/categories',
        icon: <UnorderedListOutlined />,
        label: 'Danh mục',
        path: '/categories',
      },
      {
        key: '/brands',
        icon: <TagsOutlined />,
        label: 'Thương hiệu',
        path: '/brands',
      },
      {
        key: '/receipts',
        icon: <ImportOutlined />,
        label: 'Nhập kho',
        path: '/receipts',
      },
    ],
  },
  {
    key: '/orders',
    icon: <FormOutlined />,
    label: 'Đơn hàng',
    path: '/orders',
  },
  {
    key: '/customers',
    icon: <TeamOutlined />,
    label: 'Khách hàng',
    path: '/customers',
  },
    {
    key: '/users',
    icon: <UserOutlined />,
    label: 'Người dùng',
    path: '/users',
  },
    {
    key: 'checkout',
    label: <Link to="/checkout">Bán hàng</Link>,
    icon: <ShoppingCartOutlined />,
    path: '/checkout',
  },
];

export const MENU_USERS = [
  {
    key: 'profile',
    label: 'Thông tin cá nhân',
    icon: <UserOutlined />,
  },
  {
    key: 'logout',
    label: 'Đăng xuất',
    icon: <LogoutOutlined />,
    danger: true,
  },
];
