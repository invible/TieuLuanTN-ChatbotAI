// src/components/ChatWidget.jsx
import { useState } from "react";
import {
  Button,
  Card,
  Input,
  Avatar,
} from "antd";
import {
  MessageOutlined,
  SendOutlined,
  CloseOutlined,
  RobotOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { askChatbot, retrainChatbot } from "../../services/chatbotApi";

const { TextArea } = Input;

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "bot",
      text: "Xin chào 👋, mình là Chatbot hỗ trợ phân tích bán hàng. Bạn cần hỏi gì cứ gõ nhé.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);

const handleSend = async () => {
  const text = inputValue.trim();
  if (!text || isSending) return;

  const userMsg = {
    id: Date.now(),
    from: "user",
    text,
  };

  // thêm tin nhắn user vào chat
  setMessages((prev) => [...prev, userMsg]);
  setInputValue("");
  setIsSending(true);

  // thêm “bot đang gõ...” tạm
  const typingId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: typingId,
        from: "bot",
        text: "Đang phân tích câu hỏi và truy vấn dữ liệu...",
        typing: true,
      },
    ]);

    try {
      const res = await askChatbot(text);

      const answer =
        res?.answer ||
        "Chatbot không trả lời được câu hỏi này, vui lòng thử lại.";

      // xoá bubble "đang gõ..." và thêm câu trả lời thật
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== typingId),
        {
          id: Date.now() + 2,
          from: "bot",
          text: answer,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== typingId),
        {
          id: Date.now() + 2,
          from: "bot",
          text:
            "⚠️ Có lỗi khi gọi chatbot (API). Bạn kiểm tra lại server FastAPI / Vanna hoặc thử lại sau nhé.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };


  return (
    <>
      {/* BONG BÓNG CHAT */}
      {!open && (
        <div
          style={{
            position: "fixed",
            right: 28,
            bottom: 28,
            zIndex: 9999,
          }}
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<MessageOutlined />}
            style={{
              width: 60,
              height: 60,
              background: "#1677ff",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.25)",
              border: "none",
            }}
            onClick={() => setOpen(true)}
          />
        </div>
      )}

      {/* KHUNG CHAT */}
      {open && (
        <div
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            width: 380,
            height: 560,
            zIndex: 9999,
            animation: "fadeIn 0.25s ease-out",
          }}
        >
          <Card
            style={{
              height: "100%",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              boxShadow:
                "0 8px 24px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.12)",
              overflow: "hidden",
            }}
            bodyStyle={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              padding: 0,
            }}
            headStyle={{
              background: "#1677ff",
              color: "#fff",
              padding: "12px 16px",
              fontWeight: 600,
              borderRadius: "16px 16px 0 0",
            }}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar size="small" icon={<RobotOutlined />} />
                Chatbot phân tích bán hàng
              </div>
            }
            extra={
              <Button
                type="text"
                icon={<CloseOutlined style={{ color: "white" }} />}
                onClick={() => setOpen(false)}
              />
            }
          >
            {/* VÙNG TIN NHẮN */}
            <div
              style={{
                flex: 1,
                padding: 12,
                overflowY: "auto",
                background: "#f2f5f9",
              }}
            >
              {messages.map((m) => {
                const isUser = m.from === "user";

                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      marginBottom: 10,
                      justifyContent: isUser ? "flex-end" : "flex-start",
                    }}
                  >
                    {!isUser && (
                      <Avatar
                        size="small"
                        icon={<RobotOutlined />}
                        style={{ marginRight: 8 }}
                      />
                    )}

                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 12,
                        maxWidth: "75%",
                        background: isUser ? "#1677ff" : "#ffffff",
                        color: isUser ? "#fff" : "#333",
                        whiteSpace: "pre-wrap",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      {m.text}
                    </div>

                    {isUser && (
                      <Avatar
                        size="small"
                        icon={<UserOutlined />}
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* KHUNG GÕ TIN */}
            <div
              style={{
                padding: 12,
                borderTop: "1px solid #e8e8e8",
                background: "#fff",
              }}
            >
              <TextArea
                rows={2}
                placeholder="Nhập câu hỏi và nhấn Enter để gửi..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                style={{
                  borderRadius: 10,
                  resize: "none",
                }}
                disabled={isSending}
              />
              <Button
                type="primary"
                block
                icon={<SendOutlined />}
                style={{ marginTop: 8, borderRadius: 6 }}
                onClick={handleSend}
                loading={isSending}
                disabled={isSending}
              >
                Gửi
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
