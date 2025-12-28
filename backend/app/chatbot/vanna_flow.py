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

from .config import (
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
)

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
    DOCUMENTATION  = "DOCUMENTATION"   # tra cứu tài liệu / chính sách
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
    def __init__(self, vn: MyVanna):
        self.question_classifier_prompt = get_question_classifier_prompt()
        self.additional_summary_prompt = get_additional_summary_prompt()
        self.additional_sql_prompt = get_additional_sql_prompt()

        # ✅ Engine local để đọc schema + execute SQL
        self.engine = create_engine(
            f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4",
            pool_pre_ping=True,
        )

        self.vn = vn

    # 4.1 Phân loại câu hỏi
    def classify_question(self, question: str) -> "QuestionType":
        """
        Phân loại câu hỏi bằng Ollama:
        - SQL_REQUIRED
        - DOCUMENTATION
        - GENERAL
        """
        # ✅ 0. Heuristic override (nhanh – rẻ – chính xác)
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
    
     # 4.2b Trả lời câu hỏi GENERAL (small talk, chào hỏi...)
    def answer_general(self, question: str, **kwargs) -> str:
        """
        Trả lời các câu hỏi GENERAL (chào hỏi, small talk) bằng LLM,
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

            # Gộp thành 1 prompt ngắn gọn để tối ưu tốc độ
            prompt = f"{system_prompt}\n\nNgười dùng: {question}\nTrợ lý:"

            # Tùy bạn đặt tên hàm Ollama client, ví dụ ask_llm/generate/chat...
            # Ở đây giả định bạn có self.ollama.generate(text, max_tokens=..., temperature=...)
            llm = get_ollama_llm()
            return llm.reply_general(
                system_prompt=system_prompt,
                question=question,
            )
        
        except Exception as e:
            print(f"❌ Trả lời GENERAL thất bại: {e}")
            # fallback an toàn nếu LLM bị lỗi
            return "Chào bạn! Hiện mình đang gặp một chút sự cố, bạn thử hỏi lại sau ít phút nhé."

    # 4.2b Flow trả lời DOCUMENTATION
    def answer_from_docs(self, question: str, **kwargs) -> tuple[str, List]:
        """
        Trả lời câu hỏi bằng cách sử dụng tài liệu nội bộ
        """
        try:
            # B1: Lấy tài liệu liên quan
            print("📚 Đang tra cứu tài liệu liên quan...")
            raw_docs = self.get_related_documentation(question)
            if not raw_docs:
                return (
                    "Xin lỗi, tôi không tìm thấy tài liệu liên quan để trả lời câu hỏi của bạn.",
                    [],
                )
            # B2: Chuẩn hóa tài liệu
            doc_context = "\n\n".join(
                [f"Document {i+1}: {doc}" for i, doc in enumerate(raw_docs)]
            )
            # B3: Sinh câu trả lời từ tài liệu
            print("💭 Đang sinh câu trả lời từ tài liệu...")
            llm = get_ollama_llm()

            system_prompt = """
            Bạn là trợ lý AI của cửa hàng. Trả lời 100% bằng tiếng Việt.
            Chỉ sử dụng thông tin trong tài liệu được cung cấp. Nếu tài liệu không đủ, nói rõ là chưa có thông tin.
            Ngắn gọn, đúng trọng tâm.
            """.strip()

            # raw_docs là list string/tài liệu bạn đã lấy được
            docs_json = json.dumps([{"doc": d} for d in raw_docs], ensure_ascii=False)

            answer = llm.summarize_answer(
                system_prompt=system_prompt,
                question=question,
                data_json=docs_json,
                extra_instructions="Đây là câu hỏi DOCUMENTATION. Chỉ dựa trên nội dung tài liệu trong JSON để trả lời.",
            )
            return answer, raw_docs

        except Exception as e:
            print(f"❌ Tạo câu trả lời từ tài liệu không thành công: {e}")
            return (
                f"Xin lỗi, đã có lỗi xảy ra khi truy xuất thông tin từ tài liệu: {str(e)}",
                [],
            )
        
    def _schema_text(self) -> str:
        return """
    Tables:
    - products(id, name, price, category_id)
    - orders(id, customer_id, created_at)
    - order_items(order_id, product_id, quantity, price)
    - categories(id, name)
    """



    def _generate_sql(self, question: str, **kwargs) -> str:
        try:
            # Lấy schema tinh gọn để nạp vào prompt (tránh quá tải token)
            schema_hint = self._build_schema_hint(question) 
            
            prompt = f"""
            Bạn là chuyên gia MySQL 8.0. 
            Schema: {schema_hint}
            Nhiệm vụ: Chuyển câu hỏi sau thành SQL.
            Quy tắc: 
            - CHỈ trả về câu lệnh SQL SELECT.
            - KHÔNG giải thích, KHÔNG dùng markdown.
            Câu hỏi: {question}
            SQL:"""

            # Gọi Model (2) chuyên sinh SQL
            llm = get_ollama_llm()
            # Sử dụng hàm chat thông thường thay vì vn.generate_sql nếu muốn kiểm soát hoàn toàn prompt
            raw_sql = llm._chat(
                model=llm.config.general_model, 
                messages=[{"role": "user", "content": prompt}],
                num_predict=llm.config.max_tokens_general,
            )
            
            return self._cleanup_sql(raw_sql)
        except Exception as e:
            print("--- DEBUG TRACEBACK ---")
            traceback.print_exc() # Dòng này sẽ in ra chính xác lỗi nằm ở file nào, dòng nào
            raise e
    
    _schema_hint_cache: Optional[str] = None

    def _pick_tables_for_question(self, question: str, all_tables: list[str]) -> list[str]:
        q = (question or "").lower()
        # Heuristic tối thiểu cho bài toán bán hàng
        preferred = []
        if "sản phẩm" in q or "bán chạy" in q or "top" in q:
            for name in ["products", "product", "order_items", "orders", "order", "categories", "brands"]:
                for t in all_tables:
                    if t.lower() == name:
                        preferred.append(t)
        # fallback: lấy tối đa 10 bảng đầu nếu không match
        if not preferred:
            preferred = all_tables[:10]
        # loại trùng
        seen = set()
        out = []
        for t in preferred:
            if t not in seen:
                seen.add(t)
                out.append(t)
        return out[:10]

    def _build_schema_hint(self, question: str) -> str:
        hint_lines = []
        with self.engine.connect() as conn:
            rows = conn.execute(text("SHOW TABLES")).fetchall()
            all_tables = [r[0] for r in rows]
            picked = self._pick_tables_for_question(question, all_tables)

            for t in picked:
                cols = conn.execute(text(f"SHOW COLUMNS FROM `{t}`")).fetchall()
                col_desc = ", ".join([f"{c[0]} {c[1]}" for c in cols])
                hint_lines.append(f"- {t}({col_desc})")

        # Giới hạn độ dài để agent ổn định
        schema_hint = "\n".join(hint_lines)
        return schema_hint[:6000]

    def validate_sql(self, sql: str) -> bool:
        """Validate SQL có an toàn để execute không"""
        low = sql.strip().lower()
        dangerous = ["update ", "delete ", "insert ", "drop ", "alter ", "truncate "]
        if not low.startswith("select"):
            return False
        return not any(k in low for k in dangerous)
        # return self.vn.is_sql_valid(sql)
    
    def _cleanup_sql(self, sql: str) -> str:
        """
        Làm sạch output từ LLM để lấy đúng 1 câu SELECT ... MySQL.
        - Bóc bỏ ``` ```sql
        - Bỏ tiền tố 'SQL:' nếu có
        - Lấy từ dòng bắt đầu bằng SELECT trở đi
        - Bỏ dấu ; cuối cùng nếu có
        """
        if not isinstance(sql, str):
            return ""

        # 1. Loại bỏ mã markdown ```sql ... ```
        sql = re.sub(r"^```sql\s*", "", sql.strip(), flags=re.IGNORECASE)
        sql = re.sub(r"^```\s*", "", sql.strip(), flags=re.IGNORECASE)
        sql = re.sub(r"\s*```$", "", sql.strip(), flags=re.IGNORECASE)

        # 2. Loại bỏ ký tự xuống dòng thừa, khoảng trắng thừa
        sql = sql.strip()

        # 3. Xóa những dòng rỗng đầu/cuối
        lines = [line.strip() for line in sql.splitlines() if line.strip()]
        sql = " ".join(lines)

        # 4. Đảm bảo câu lệnh bắt đầu bằng SELECT
        if not sql.lower().startswith("select"):
            raise Exception(f"Model trả về không phải câu SELECT hợp lệ: {sql}")

        # 5. Xóa dấu ; thừa (nếu bạn muốn)
        if sql.endswith(";"):
            sql = sql[:-1].strip()

        return sql
    
    def run_sql(self, sql: str) -> pd.DataFrame:
        engine = create_engine(
            f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
        )
        return pd.read_sql(sql, engine)

    # 4.5 Thực thi SQL và chuẩn bị data
    def execute_sql_safe(self, sql: str) -> pd.DataFrame:
        """
        Thực thi SQL và trả về DataFrame.
        - Chỉ chạy SQL qua Vanna (MySQL connector mà Vanna đang giữ).
        - Có kiểm tra an toàn SQL trước khi chạy.
        - Quăng lỗi rõ ràng.
        """

        try:
            clean_sql = sql.strip().rstrip(";")

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

    # 4.6 Tóm tắt kết quả DataFrame bằng tiếng Việt
    def generate_answer(self, question: str, df: pd.DataFrame) -> str:
        """
        Tóm tắt kết quả truy vấn SQL bằng Ollama LLM.
        Chỉ gửi một lượng dữ liệu JSON vừa phải lên model.
        """
        llm = get_ollama_llm()
        system_prompt = get_additional_summary_prompt()

        # # Nếu không có dữ liệu
        # if df is None or df.empty:
        #     data_json = "[]"
        # else:
        #     # Giảm số dòng gửi lên để tránh prompt quá dài, ví dụ max 50 dòng
        #     df_to_send = df.head(10)
        #     data_json = df_to_send.to_json(orient="records", force_ascii=False)

        # answer = llm.summarize_answer(
        #     system_prompt=system_prompt,
        #     question=question,
        #     data_json=data_json,
        # )
        # 1. Gọt giũa dữ liệu (Chỉ lấy cột cần thiết để tiết kiệm token)
        # Loại bỏ các cột rác đã nói ở bước trước
        blacklist = ['description', 'image_url', 'created_at', 'brand_id']
        clean_df = df.drop(columns=[c for c in blacklist if c in df.columns]).head(5)
        
        data_json = clean_df.to_json(orient='records', force_ascii=False)

        # 2. Tạo nội dung yêu cầu (User Prompt) rõ ràng
        user_content = f"""
    Hãy trả lời câu hỏi sau dựa trên dữ liệu thực tế.

    CÂU HỎI: {question}
    DỮ LIỆU JSON TỪ HỆ THỐNG: {data_json}

    TRẢ LỜI:"""

        # 3. Gọi model tóm tắt
        return llm._chat(
            model=llm.config.summary_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            num_predict=200 # Giới hạn độ dài để tránh model lảm nhảm
        )
        return answer

    # 4.7 Flow tổng hợp: nhận câu hỏi từ user và trả về QuestionResponse
    def ask_question(
        self,
        question: str,
        allow_llm_to_see_data: bool = True,
        **kwargs,
    ) -> QuestionResponse:
        """
        Enhanced function để xử lý câu hỏi với preprocessing để phân biệt SQL vs Documentation

        Args:
            question: Câu hỏi của user
            allow_llm_to_see_data: Cho phép LLM xem data để tối ưu SQL
            retry_config: Cấu hình retry logic

        Returns:
            QuestionResponse object chứa answer và metadata
        """

        t0 = time.time()
        logger.info(f"[ASK] Nhận câu hỏi: {question}")

        response = QuestionResponse(status=ResponseStatus.SUCCESS, question=question)

        try:
            # --- (1) PHÂN LOẠI (Dùng model nhỏ) ---
            t1 = time.time()
            question_type = self.classify_question(question)
            t2 = time.time()
            logger.info(f"[ASK] classify_question mất {t2 - t1:.2f}s, loại={question_type}")

            response.question_type = question_type
            print(f"📝 Loại câu hỏi: {question_type.value}")

            # 1. GENERAL => LLM trả lời trực tiếp (không dùng tài liệu, không SQL)
            if question_type == QuestionType.GENERAL:
                print("💬 Xử lý câu hỏi GENERAL (small talk)...")
                answer = self.answer_general(question, **kwargs)
                response.answer = answer
                # response.execution_time = time.time() - start_time
                # print(
                #     f"✅ Đã trả lời GENERAL trong {response.execution_time:.2f}s"
                # )
                return response

            # 2. DOCUMENTATION => tra cứu tài liệu nội bộ (RAG)
            if question_type == QuestionType.DOCUMENTATION:
                print("📚 Xử lý câu hỏi DOCUMENTATION (tra cứu tài liệu)...")
                answer, related_docs = self.answer_from_docs(
                    question, **kwargs
                )
                response.answer = answer
                response.related_docs = related_docs
                # response.execution_time = time.time() - start_time
                # print(
                #     f"✅ Đã tra cứu tài liệu trong {response.execution_time:.2f}s"
                # )
                return response
        
            # 3.SQL_REQUIRED => Câu hỏi cần SQL → sinh SQL + thực thi
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

            # # Tách image khỏi df nếu có
            # df, images = split_base64_from_df(df)
            # print(f"🖼️ Got {len(images)} images")
            # response.images = images
            # response.rows_count = len(df)

            # # Format định dạng tiền VNĐ => giúp LLM dễ hiểu hơn
            # df = format_dataframe(df)

            # Bình thường: sinh câu trả lời từ toàn bộ DataFrame
            t6 = time.time()
            answer = self.generate_answer(question, df, **kwargs)
            response.answer = answer

            t7 = time.time()
            logger.info(f"[ASK] summarize_answer mất {t7 - t6:.2f}s")
            logger.info(f"[ASK] Tổng thời gian request: {t7 - t0:.2f}s")

            response.execution_time = t7 - t0
            print(f"✅ Quá trình xử lý SQL hoàn tất trong {response.execution_time:.2f}s")
            # # Tổng thời gian chạy
            # response.execution_time = time.time() - start_time
            # print(f"✅ Quá trình xử lý SQL hoàn tất trong {response.execution_time:.2f}s")

        except Exception as e:
            # Bắt mọi lỗi và trả về cho frontend
            response.status = ResponseStatus.ERROR
            response.error_message = str(e)
            response.answer = "Không tìm thấy dữ liệu phù hợp cho câu hỏi của bạn."
            response.execution_time = time.time() - t0
            # response.execution_time = time.time() - start_time
            print(f"❌ Error: {e}")

        return response

########################################
# 4. Hàm khởi tạo / retrain cho app.main dùng
########################################

# giữ 1 biến toàn cục
_vanna_flow: VannaChatFlow | None = None

def initialize_flow(qa_seed_path: str = "seed/qa_seed.json"):
    """
    Gọi hàm này khi server start hoặc khi admin nhấn `Retrain`.
    - Tạo MyVanna (kết nối LM Studio + Chroma)
    - Train schema (DDL)
    - Train Q&A mẫu
    - Tạo flow
    """

    # Train data chỉ 1 lần khi khởi tạo
    # # Train schema
    # vn.train_schema(TABLES)

    # # Train Q&A seed
    # if qa_seed_path and os.path.exists(qa_seed_path):
    #     try:
    #         with open(qa_seed_path, "r", encoding="utf-8") as f:
    #             qa_pairs = json.load(f)
    #     except Exception as e:
    #         print("[initialize_flow] Lỗi đọc qa_seed.json:", e)
    #         qa_pairs = []
    #     vn.train_qa_pairs(qa_pairs)


    global _vanna_flow
    if _vanna_flow is None:
        vn = MyVanna()
        _vanna_flow = VannaChatFlow(vn=vn)

def get_vanna_flow() -> VannaChatFlow:
    if _vanna_flow is None:
        initialize_flow()
    return _vanna_flow