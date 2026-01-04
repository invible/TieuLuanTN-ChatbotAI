import os
import time
import json
import re
import pandas as pd
import traceback
from sqlalchemy import create_engine
from sqlalchemy import text
from enum import Enum
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field

# from vanna.remote import VannaDefault
from app.chatbot.vanna_client import MyVanna
from .vanna_cloud_client import VannaCloudClient

from .db import create_engine_local

from .ollama_llm import OllamaLlm

from .prompt import (
    get_additional_sql_prompt,
    get_additional_summary_prompt,
    get_question_classifier_prompt,
)

########################################
# 1. Kiểu trạng thái / phân loại câu hỏi
########################################

class ResponseStatus(Enum):
    SUCCESS = True
    WARNING = True
    ERROR   = False

class QuestionType(str, Enum):
    SQL_REQUIRED   = "SQL_REQUIRED"    # cần truy vấn DB
    DOCUMENTATION  = "DOCUMENTATION"   # tra cứu tài liệu / chính sách cửa hàng
    GENERAL        = "GENERAL"         # câu hỏi chung chung

########################################
# 2. Cấu trúc kết quả trả về cho frontend
########################################

@dataclass
class QuestionResponse:
    status: ResponseStatus
    question: str
    question_type: Optional[QuestionType] = None
    answer: Optional[str] = None
    sql: Optional[str] = None
    error_message: Optional[str] = None
    execution_time: Optional[float] = None
    rows_count: Optional[int] = None
    related_docs: Optional[List] = None
    images: Optional[List[str]] = None

_ollama_llm: OllamaLlm | None = None

def get_ollama_llm() -> OllamaLlm:
    global _ollama_llm
    if _ollama_llm is None:
        _ollama_llm = OllamaLlm()
    return _ollama_llm

########################################
# 3. Flow xử lý câu hỏi
########################################

import logging

logger = logging.getLogger(__name__)

SQL_HINT_PATTERNS = [
    r"\btop\s*\d+\b",
    r"bán\s+chạy",
    r"doanh\s*thu",
    r"đơn\s*hàng",
    r"tồn\s*kho",
    r"thống\s*kê",
    r"báo\s*cáo",
    r"bao\s*nhiêu",
    r"tổng\s+số",
    r"theo\s+(ngày|tháng|năm)",
    r"lợi\s*nhuận",
    r"sản\s*phẩm",
    r"khách\s*hàng",
]

def heuristic_question_type(question: str) -> Optional[QuestionType]:
    q = (question or "").lower().strip()
    for pat in SQL_HINT_PATTERNS:
        if re.search(pat, q):
            return QuestionType.SQL_REQUIRED
    return None

class VannaChatFlow:
    def __init__(self, vn: VannaCloudClient):
        self.question_classifier_prompt = get_question_classifier_prompt()
        # self.additional_summary_prompt = get_additional_summary_prompt()
        # self.additional_sql_prompt = get_additional_sql_prompt()

        # Engine local để đọc schema + execute SQL
        self.engine = create_engine_local()

        self.vn = vn

    # 4.1 Phân loại câu hỏi
    def classify_question(self, question: str) -> "QuestionType":
        """
        Phân loại câu hỏi bằng Ollama:
        - SQL_REQUIRED
        - DOCUMENTATION
        - GENERAL
        """
        # 0. Heuristic override (nhanh – nhẹ - chính xác)
        hinted = heuristic_question_type(question)
        if hinted is not None:
            print(f"[classify_question][heuristic] '{question}' -> {hinted}")
            return hinted

        llm = get_ollama_llm()
        system_prompt = get_question_classifier_prompt()

        label = llm.classify_question(system_prompt=system_prompt, question=question)

        if label == "SQL_REQUIRED":
            qt = QuestionType.SQL_REQUIRED
        elif label == "DOCUMENTATION":
            qt = QuestionType.DOCUMENTATION
        else:
            qt = QuestionType.GENERAL

        print(f"[classify_question] '{question}' -> {qt}")
        return qt
    
     # 4.2b Trả lời câu hỏi GENERAL (chào hỏi, tán gẫu...)
    def answer_general(self, question: str, **kwargs) -> str:
        """
        Trả lời các câu hỏi GENERAL (chào hỏi, tán gẫu) bằng LLM Ollama,
        KHÔNG tra cứu tài liệu, KHÔNG sinh SQL.
        """
        try:
            system_prompt = """
            Bạn là một trợ lý AI thân thiện của cửa hàng.

            Nhiệm vụ:
            - Trò chuyện, chào hỏi người dùng.
            - Hướng dẫn người dùng cách đặt câu hỏi về:
            + báo cáo doanh số / đơn hàng / sản phẩm
            + chính sách bán hàng, đổi trả, thanh toán, đăng ký, đăng nhập,...

            QUY TẮC:
            - Trả lời 100% bằng tiếng Việt.
            - Ngắn gọn, tự nhiên, lịch sự.
            - Xưng "mình" hoặc "tôi", gọi người dùng là "bạn".
            - Nếu người dùng chỉ chào (ví dụ: "xin chào", "hello", "hi"):
            → trả lời một câu chào thân thiện và gợi ý họ hỏi tiếp.
            """.strip()

            llm = get_ollama_llm()
            return llm.reply_general(
                system_prompt=system_prompt,
                question=question,
            )
        
        except Exception as e:
            print(f"❌ Trả lời GENERAL thất bại: {e}")
            # fallback an toàn nếu LLM bị lỗi
            return "Chào bạn! Hiện mình đang gặp một chút sự cố, bạn thử hỏi lại sau ít phút nhé."

    # 4.3 Câu hỏi là SQL_REQUIRED
    # Chuyển câu hỏi cho VannaCloud tạo SQL query
    def _generate_sql(self, question: str, **kwargs) -> str:
        """
        Sinh SQL từ câu hỏi bằng VannaCloud.
        """
        sql = None
        try:
        # Sử dụng generate_sql trực tiếp từ vanna
            sql = self.vn.generate_sql(question=question)
        
        # Nếu cần dọn dẹp (xóa dấu ; hoặc code block ```sql)
            if hasattr(self, '_cleanup_sql'):
                return self._cleanup_sql(sql)
                
            return sql

        except Exception as e:
            print("--- DEBUG TRACEBACK VANNACLOUD ---")
            import traceback
            traceback.print_exc()
            raise e

    # Hàm phụ kiểm tra SQL query hợp lệ -> phải bắt đầu bằng SELECT
    def validate_sql(self, sql: str) -> bool:
        """
        Validate SQL xem có an toàn để execute không
        """
        low = sql.strip().lower()
        dangerous = ["update ", "delete ", "insert ", "drop ", "alter ", "truncate "]
        if not low.startswith("select"):
            return False
        return not any(k in low for k in dangerous)
        # return self.vn.is_sql_valid(sql)
    
    # Hàm phụ làm sạch SQL query trước khi thực thi
    def _cleanup_sql(self, sql: str) -> str:
        """
        Làm sạch output từ LLM để lấy đúng 1 câu SELECT ... MySQL.
        """
        if not isinstance(sql, str):
            return ""

        # Loại bỏ mã markdown ```sql ... ```
        sql = re.sub(r"^```sql\s*", "", sql.strip(), flags=re.IGNORECASE)
        sql = re.sub(r"^```\s*", "", sql.strip(), flags=re.IGNORECASE)
        sql = re.sub(r"\s*```$", "", sql.strip(), flags=re.IGNORECASE)

        # Loại bỏ ký tự xuống dòng thừa, khoảng trắng thừa
        sql = sql.strip()

        # Xóa những dòng rỗng đầu/cuối
        lines = [line.strip() for line in sql.splitlines() if line.strip()]
        sql = " ".join(lines)

        # Đảm bảo câu lệnh bắt đầu bằng SELECT
        if not sql.lower().startswith("select"):
            raise Exception(f"Model trả về không phải câu SELECT hợp lệ: {sql}")

        # Xóa dấu ; thừa (nếu bạn muốn)
        if sql.endswith(";"):
            sql = sql[:-1].strip()

        return sql
    
    # Hàm phụ thực thi SQL query trên Database local (MySQL)
    def run_sql(self, sql: str) -> pd.DataFrame:
        return pd.read_sql(sql, self.engine)

    # 4.5 Thực thi SQL và chuẩn bị data
    def execute_sql_safe(self, sql: str) -> pd.DataFrame:
        """
        Thực thi SQL và trả về DataFrame.
        """

        try:
            clean_sql = sql.strip().rstrip(";")
            print("[SQL query]\n", clean_sql)

            if not self.validate_sql(clean_sql):
                raise Exception("Câu lệnh SQL bị chặn vì không an toàn.")

            # Vanna: vn.run_sql -> trả về pandas.DataFrame
            df = self.run_sql(clean_sql)
            print("[DEBUG DF]\n", df.head(), "\n", df.dtypes)
            
            if df is None:
                raise Exception("Query trả về None thay vì DataFrame.")

            if not isinstance(df, pd.DataFrame):
                raise Exception(f"Query không trả về DataFrame: {type(df)}")

            return df

        except Exception as e:
            raise Exception(f"Thực thi SQL thất bại: {str(e)}")

    # 4.6 Tóm tắt kết quả DataFrame và sinh câu trả lời tiếng Việt
    def generate_answer(self, question: str, df: pd.DataFrame, **kwargs) -> str:
        """
        Tóm tắt kết quả truy vấn SQL bằng Ollama LLM.
        """
        try:
            llm = get_ollama_llm()
            
            # Chuyển DataFrame thành JSON để LLM đọc
            data_json = df.head(10).to_json(orient="records", indent=2, force_ascii=False)

            # 2. Xây dựng Prompt cho LLM
            user_content = f"""
            Tổng hợp dữ liệu từ database để trả lời câu hỏi
            """

            system_prompt = f"""
            Bạn là trợ lý báo cáo bán hàng.

            Dưới đây là kết quả truy vấn dữ liệu, đã được xử lý chính xác.

            YÊU CẦU:
            - Dựa trên câu hỏi và dữ liệu được cung cấp hãy trả lời ngắn gọn, chính xác, lịch sự bằng Tiếng Việt.
            - Nếu dữ câu hỏi về doanh thu hoặc giá tiền, hãy trả lời bằng đơn vị "VNĐ".
            - Với dữ liệu chỉ có một giá trị, hãy trả lời dưới dạng câu hoàn chỉnh.
            - Với dữ liệu bảng nhiều dòng, hãy liệt kê bằng cách gạch đầu dòng.
            - Chỉ sử dụng đúng dữ liệu được cung cấp, không suy đoán, không thêm thông tin.
            - Không nhắc đến SQL, hệ thống hay AI.

            CÂU HỎI:
            {question}

            DỮ LIỆU:
            {data_json}

            TRẢ LỜI:
            """.strip()

            # 3. Gọi model tóm tắt (Sử dụng đúng method của OllamaLlm bạn đã viết)
            answer = llm._chat(
                model=llm.config.summary_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                num_predict=400, # Tăng lên để trả lời được danh sách dài hơn
                temperature=0.1,
            )
            
            return answer

        except Exception as e:
            print(f"❌ Lỗi trong generate_answer: {e}")
            return f"Tôi đã tìm thấy dữ liệu nhưng gặp lỗi khi tóm tắt: {str(e)}. Bạn có thể xem bảng dữ liệu đính kèm."

    # 4.7 Flow chat tổng hợp: nhận câu hỏi từ user và trả về QuestionResponse
    def ask_question(
        self,
        question: str,
        **kwargs,
    ) -> QuestionResponse:
        """
        Xử lý câu hỏi từ user và trả về câu trả lời cùng metadata.
        """

        t0 = time.time()
        logger.info(f"[ASK] Nhận câu hỏi: {question}")

        response = QuestionResponse(status=ResponseStatus.SUCCESS, question=question)

        try:
            # PHÂN LOẠI (Dùng LLM nhỏ)
            t1 = time.time()
            question_type = self.classify_question(question)
            t2 = time.time()
            logger.info(f"[ASK] classify_question mất {t2 - t1:.2f}s, loại={question_type}")

            response.question_type = question_type
            print(f"📝 Loại câu hỏi: {question_type.value}")

            # 1. Câu hỏi GENERAL => LLM trả lời trực tiếp (không dùng tài liệu, không SQL)
            if question_type == QuestionType.GENERAL:
                print("Xử lý câu hỏi GENERAL (small talk)...")
                answer = self.answer_general(question, **kwargs)
                response.answer = answer
                return response
        
            # 3. Câu hỏi SQL_REQUIRED => Câu hỏi cần SQL → sinh SQL + thực thi
            t3 = time.time()
            sql = None
            df = None

            sql = self._generate_sql(question, **kwargs)
            response.sql = sql

            t4 = time.time()
            logger.info(f"[ASK] generate_sql mất {t4 - t3:.2f}s, sql={sql}")

            # Thực thi SQL an toàn
            df = self.execute_sql_safe(sql)
            response.rows_count = len(df)

            t5 = time.time()
            logger.info(f"[ASK] run_sql mất {t5 - t4:.2f}s, rows={len(df) if df is not None else 0}")

            # Không có SQL hợp lệ
            if not sql or sql.strip() == "":
                response.status = ResponseStatus.WARNING
                response.error_message = (
                    "Không thể tạo SQL từ câu hỏi"
                )
                response.answer = "Không tìm thấy dữ liệu phù hợp cho câu hỏi của bạn."
                return response

            # Thực thi SQL nhưng không có dữ liệu
            if df is None or df.empty:
                response.status = ResponseStatus.WARNING
                response.error_message = "Truy vấn được thực hiện nhưng không có dữ liệu trả về"
                response.answer = "Không tìm thấy dữ liệu phù hợp cho câu hỏi của bạn."
                return response

            # Dữ liệu quá nhiều bản ghi → cảnh báo + tóm tắt top 50
            if len(df) > 50:
                response.status = ResponseStatus.WARNING
                response.error_message = "Truy vấn được thực hiện nhưng trả về quá nhiều dòng"
                response.answer = "Câu hỏi quá rộng, bạn hãy đặt câu hỏi cụ thể hơn để có kết quả tốt nhất."
                return response

            t6 = time.time()
            answer = self.generate_answer(question, df, **kwargs)
            response.answer = answer

            t7 = time.time()
            logger.info(f"[ASK] summarize_answer mất {t7 - t6:.2f}s")
            logger.info(f"[ASK] Tổng thời gian request: {t7 - t0:.2f}s")

            response.execution_time = t7 - t0
            print(f"✅ Quá trình xử lý SQL hoàn tất trong {response.execution_time:.2f}s")

        except Exception as e:
            # Bắt mọi lỗi và trả về cho frontend
            response.status = ResponseStatus.ERROR
            response.error_message = str(e)
            response.answer = "Không tìm thấy dữ liệu phù hợp cho câu hỏi của bạn."
            response.execution_time = time.time() - t0
            print(f"❌ Error: {e}")

        return response

########################################
# 4. Hàm khởi tạo / retrain cho app.main dùng
########################################

# giữ 1 biến toàn cục
_vanna_flow: VannaChatFlow | None = None

def initialize_flow(qa_seed_path: str = "seed/qa_seed.json"):
    """
    Tạo VannaCloudClient
    Tạo flow
    """

    global _vanna_flow
    if _vanna_flow is None:
        vn = VannaCloudClient()
        _vanna_flow = VannaChatFlow(vn=vn)

def get_vanna_flow() -> VannaChatFlow:
    if _vanna_flow is None:
        initialize_flow()
    return _vanna_flow