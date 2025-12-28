import { api } from "./http";

// export const askChatbot = (question) =>
//   api.post("/chatbot/ask", { question });

export async function askChatbot(message) {
  const res = await api.post("/chatbot/ask", {
    message,
    allow_llm_to_see_data: false,
    include_sql: true,
  });

  return res.data;
}

export async function retrainChatbot() {
  const res = await api.post("chatbot/admin/retrain");
  return res.data;
}