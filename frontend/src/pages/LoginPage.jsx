import { Form, Input, Button, Checkbox, App } from "antd";
import {
  MailOutlined,
  LockOutlined,
  GoogleOutlined,
  FacebookOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { login, logout, isLoggedIn } from "../services/authService";
import api from "../services/http";

import '../styles/login.css';

import logo from "../assets/logo.png";

const LoginPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();

const handleFinish = async (values) => {
  try {
    const res = await login(values.email, values.password);

    const access_token = res.data?.access_token || res.access_token;

    if (!access_token) {
      message.error("Không nhận được token từ máy chủ");
      return;
    }

    localStorage.setItem("access_token", access_token);

    message.success("Đăng nhập thành công");
    navigate("/dashboard", { replace: true });

  } catch (err) {
    console.error("Login Error:", err.response?.data);
    message.error(err.response?.data?.detail || "Sai email hoặc mật khẩu");
  }
};

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo + brand */}
        <div className="auth-logo">
            <img
              src={logo}
              alt="Hoàng Yến Shop"
              className="auth-logo-img"
            />
          <div className="auth-logo-title">Admin Dashboard</div>
        </div>

        {/* Title */}
        <div className="auth-subtitle">
          Vui lòng đăng nhập để tiếp tục
        </div>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
        >
          <Form.Item
            label={<span className="auth-label">EMAIL</span>}
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập đúng email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined style={{ color: "#9fb3c8" }} />}
              placeholder="Nhập địa chỉ email của bạn"
            />
          </Form.Item>

          <Form.Item
            label={<span className="auth-label">PASSWORD</span>}
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập đúng mật khẩu" },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: "#9fb3c8" }} />}
              placeholder="Nhập mật khẩu của bạn"
            />
          </Form.Item>

          <div className="auth-checkbox-row" style={{ marginBottom: 12 }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>
            <a href="#!" style={{ fontSize: 13 }}>
              Quên mật khẩu?
            </a>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              style={{ borderRadius: 6 }}
            >
              <i className="fa fa-sign-in" style={{ marginRight: 6 }} />
              ĐĂNG NHẬP
            </Button>
          </Form.Item>
        </Form>

        {/* Social login */}
        <div className="auth-divider">
          <span>hoặc tiếp tục với</span>
        </div>

        <div className="auth-social-row">
          <Button
            className="auth-social-btn"
            icon={<GoogleOutlined />}
            danger
          />
          <Button
            className="auth-social-btn"
            icon={<FacebookOutlined />}
            style={{ borderColor: "#1877f2", color: "#1877f2" }}
          />
          <Button className="auth-social-btn">X</Button>
        </div>

        <div className="auth-footer-text">
          Bạn chưa có tài khoản?{" "}
          <Link to="/register">Nhấn vào để đăng ký</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
