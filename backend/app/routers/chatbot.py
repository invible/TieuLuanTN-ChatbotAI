from fastapi import APIRouter, HTTPException
from app.schemas import ChatRequest, ChatResponse
from app.chat_service import MyChatService
from app.db import get_db
from app import models, schemas


router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

# TODO: import và init Vanna của bạn
# from ..vanna_client import my_vanna


# @router.post("/ask", response_model=ChatResponse)
# async def ask_chatbot(req: ChatRequest):
#     question = req.question

#     # TODO: dùng code hiện tại của bạn:
#     # 1. Phân loại câu hỏi (DOCUMENTATION / SQL_REQUIRED ...)
#     # 2. Gọi Vanna sinh SQL nếu cần
#     # 3. Chạy SQL trên MySQL
#     # 4. Tóm tắt kết quả bằng LLM
#     answer = "Demo: đây là câu trả lời từ chatbot cho câu hỏi: " + question

#     return ChatResponse(answer=answer)

chat_service = MyChatService()

@router.post("/ask", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        answer = await chat_service.ask(request.question)
        return ChatResponse(answer=answer)
    except Exception as e:
        # log lỗi chi tiết để debug
        print("Chat error:", e)
        raise HTTPException(status_code=500, detail="Chatbot lỗi nội bộ, vui lòng thử lại")