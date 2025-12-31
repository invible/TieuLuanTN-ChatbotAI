import {
  DashboardOutlined,
  ProductOutlined,
  TableOutlined,
  FileTextOutlined,
  FormOutlined,
  UserOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import { Link } from "react-router-dom";

export const MENU_ITEMS = [
  {
  key: 'checkout',
  label: <Link to="/checkout">Bán hàng</Link>,
  icon: <SearchOutlined />,
  path: '/checkout',
  },
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    path: '/',
  },
  {
    key: 'product-management',
    icon: <ProductOutlined />,
    label: 'Quản lý sản phẩm',
    children: [
      {
        key: '/products',
        icon: <ProductOutlined />,
        label: 'Sản phẩm',
        path: '/products',
      },
      {
        key: '/categories',
        icon: <TableOutlined />,
        label: 'Danh mục',
        path: '/categories',
      },
      {
        key: '/brands',
        icon: <TableOutlined />,
        label: 'Thương hiệu',
        path: '/brands',
      },
      {
        key: '/receipts',
        icon: <FileTextOutlined />,
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
    key: '/users',
    icon: <UserOutlined />,
    label: 'Người dùng',
    path: '/users',
  },
  {
    key: '/customers',
    icon: <UserOutlined />,
    label: 'Khách hàng',
    path: '/customers',
  },
];
