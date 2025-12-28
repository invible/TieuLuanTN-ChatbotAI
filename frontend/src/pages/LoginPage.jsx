// src/pages/LoginPage.jsx
import { Form, Input, Button, Checkbox } from "antd";
import {
  MailOutlined,
  LockOutlined,
  GoogleOutlined,
  FacebookOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleFinish = async (values) => {
    // TODO: gọi API đăng nhập thật sự ở đây
    // ví dụ: await authLogin(values.email, values.password)
    console.log("Login values:", values);
    // demo: sau khi login xong chuyển về dashboard
    navigate("/");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo + brand */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            {/* icon đơn giản */}
            <i className="fa fa-layer-group" />
          </div>
          <div className="auth-logo-title">ElaAdmin</div>
        </div>

        {/* Title */}
        <div className="auth-title">Welcome Back!</div>
        <div className="auth-subtitle">
          Please sign in to your account
        </div>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
        >
          <Form.Item
            label={<span className="auth-label">EMAIL ADDRESS</span>}
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Email is not valid" },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined style={{ color: "#9fb3c8" }} />}
              placeholder="Enter your email"
            />
          </Form.Item>

          <Form.Item
            label={<span className="auth-label">PASSWORD</span>}
            name="password"
            rules={[
              { required: true, message: "Please enter your password" },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: "#9fb3c8" }} />}
              placeholder="Enter your password"
            />
          </Form.Item>

          <div className="auth-checkbox-row" style={{ marginBottom: 12 }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <a href="#!" style={{ fontSize: 13 }}>
              Forgot Password?
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
              Sign In
            </Button>
          </Form.Item>
        </Form>

        {/* Social login */}
        <div className="auth-divider">
          <span>or continue with</span>
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
          Don&apos;t have an account?{" "}
          <Link to="/register">Create one here</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
