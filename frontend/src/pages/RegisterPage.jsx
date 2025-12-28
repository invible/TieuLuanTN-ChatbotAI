// src/pages/RegisterPage.jsx
import { Form, Input, Button, Checkbox } from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  GoogleOutlined,
  FacebookOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleFinish = async (values) => {
    // TODO: gọi API đăng ký thật ở đây
    // ví dụ: await authRegister(values)
    console.log("Register values:", values);
    // demo: sau khi đăng ký xong chuyển sang login
    navigate("/login");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo + brand */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <i className="fa fa-layer-group" />
          </div>
          <div className="auth-logo-title">ElaAdmin</div>
        </div>

        {/* Title */}
        <div className="auth-title">Create Account</div>
        <div className="auth-subtitle">
          Join us and get started today
        </div>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
        >
          <Form.Item
            label={<span className="auth-label">FULL NAME</span>}
            name="full_name"
            rules={[
              { required: true, message: "Please enter your full name" },
            ]}
          >
            <Input
              size="large"
              prefix={<UserOutlined style={{ color: "#9fb3c8" }} />}
              placeholder="Enter your full name"
            />
          </Form.Item>

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
              { required: true, message: "Please create a password" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
            extra={
              <span style={{ fontSize: 12, color: "#9fb3c8" }}>
                Must be at least 8 characters
              </span>
            }
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: "#9fb3c8" }} />}
              placeholder="Create a strong password"
            />
          </Form.Item>

          <Form.Item
            name="agree"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("You must agree to continue")
                      ),
              },
            ]}
          >
            <Checkbox style={{ fontSize: 13 }}>
              I agree to the{" "}
              <a href="#!">Terms of Service</a> and{" "}
              <a href="#!">Privacy Policy</a>
            </Checkbox>
          </Form.Item>

          <Form.Item style={{ marginTop: 4 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              style={{ borderRadius: 6 }}
            >
              <i
                className="fa fa-user-plus"
                style={{ marginRight: 6 }}
              />
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-divider">
          <span>or sign up with</span>
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
          Already have an account?{" "}
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
