// src/components/dashboard/ChatbotCard.jsx
import { useState } from "react";
import { Card, Input, Button, Typography } from "antd";
import { RobotOutlined, SendOutlined } from "@ant-design/icons";
import { askChatbot } from "../../services/chatbotApi";

const { TextArea } = Input;
const { Paragraph, Text } = Typography;

const ChatbotCard = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    try {
      setLoading(true);
      setAnswer("");
      const res = await askChatbot(question);
      setAnswer(res.data.answer || "Chatbot chưa trả lời được.");
    } catch (error) {
      console.error("Lỗi gọi Chatbot:", error);
      setAnswer("Có lỗi xảy ra khi gọi Chatbot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      bordered={false}
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RobotOutlined />
          <span>Chatbot AI phân tích bán hàng</span>
        </span>
      }
      styles={{
        header: {
          borderRadius: "20px 20px 0 0",
          background:
            "linear-gradient(90deg, rgba(22,119,255,0.95), rgba(56,189,248,0.95))",
          color: "#fff",
          fontWeight: 600,
        },
        body: {
          padding: 16,
          background: "#ffffff",
          borderRadius: "0 0 20px 20px",
        },
      }}
      style={{
        borderRadius: 20,
        boxShadow: "0 12px 32px rgba(15,23,42,0.14)",
        maxWidth: 480,
      }}
    >
      <TextArea
        rows={3}
        placeholder="Hỏi về doanh thu, đơn hàng, top sản phẩm..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{
          marginBottom: 12,
          borderRadius: 12,
          resize: "none",
        }}
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleAsk}
        loading={loading}
        block
        style={{ borderRadius: 999 }}
      >
        Hỏi Chatbot
      </Button>

      <div style={{ marginTop: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Kết quả phân tích:
        </Text>
        <Paragraph
          style={{
            marginTop: 8,
            whiteSpace: "pre-line",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {answer || "Chưa có câu trả lời."}
        </Paragraph>
      </div>
    </Card>
  );
};

export default ChatbotCard;
