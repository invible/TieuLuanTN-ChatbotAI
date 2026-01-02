# backend/chatbot_bi/router.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List

from .vanna_flow import (
    get_vanna_flow,
    VannaChatFlow,
    ResponseStatus,
    QuestionType
)

router = APIRouter(
    prefix="/chatbot",       # tất cả endpoint sẽ bắt đầu bằng /chatbot
    tags=["chatbot-bi"],
)

# Request / Response model: lấy lại logic từ main.py cũ
class QuestionRequest(BaseModel):
    message: str
    allow_llm_to_see_data: bool = False
    include_sql: bool = True


class TextAnswerResponse(BaseModel):
    success: bool
    question: str
    question_type: QuestionType
    answer: Optional[str] = None
    sql: Optional[str] = None
    error_message: Optional[str] = None
    execution_time: Optional[float] = None
    rows_count: Optional[int] = None
    related_docs: Optional[List] = None
    images: Optional[List[str]] = None


@router.post("/ask", response_model=TextAnswerResponse)
async def ask_question(
    request: QuestionRequest,
    flow: VannaChatFlow = Depends(get_vanna_flow),
):
    """
    API ChatBot: nhận câu hỏi tự nhiên, phân loại (SQL / DOCUMENTATION / GENERAL),
    sinh SQL nếu cần, thực thi, và trả về câu trả lời tiếng Việt.
    """
    try:
        result = flow.ask_question(
            question=request.message,
            allow_llm_to_see_data=request.allow_llm_to_see_data,
        )

        status_obj = getattr(result, "status", None)
        if isinstance(status_obj, ResponseStatus):
            success_flag = status_obj == ResponseStatus.SUCCESS
        else:
            success_flag = True

        # Kiểm tra nếu result.question_type tồn tại và có thuộc tính .value
        qt_obj = getattr(result, "question_type", None)
        question_type_str = qt_obj.value if (qt_obj and hasattr(qt_obj, "value")) else None

        err_str = None
        if not success_flag:
            err_str = getattr(result, "error_message", None) or getattr(
                result, "error", None
            )

        return TextAnswerResponse(
            success=success_flag,
            question=getattr(result, "question", request.message),
            question_type=question_type_str,
            answer=getattr(result, "answer", None),
            sql=getattr(result, "sql", None),
            error_message=err_str,
            execution_time=getattr(result, "execution_time", None),
            rows_count=getattr(result, "rows_count", None),
            related_docs=getattr(result, "related_docs", None),
            images=getattr(result, "images", None),
        )
    except Exception as e:
        print(f"🔥 Critical Error tại Router: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Lỗi hệ thống: {str(e)}"
        )


# @router.post("/admin/retrain")
# def admin_retrain():
#     """
#     Gọi lại initialize_flow để retrain:
#     - Khi thay đổi schema DB
#     - Khi cập nhật seed/qa_seed.json
#     - Khi vừa bật lại Ollama
#     """
#     try:
#         initialize_flow()
#         return {"ok": True, "msg": "Retrain done."}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
