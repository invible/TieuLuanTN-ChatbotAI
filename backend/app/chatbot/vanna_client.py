import os
import pandas as pd
import pymysql

from typing import List

from vanna.ollama import Ollama
from vanna.chromadb.chromadb_vector import ChromaDB_VectorStore

from .config import (
    OLLAMA_BASE_URL,
    OLLAMA_API_KEY,
    OLLAMA_MODEL,
    VECTOR_DIR,
)

from .prompt import get_additional_sql_prompt
from .db import get_mysql_connection

class MyVanna(ChromaDB_VectorStore, Ollama):
    """
    Kết hợp:
    - OpenAI_Chat => gọi LLM (ở đây là LM Studio qua OpenAI-compatible API)
    - ChromaDB_VectorStore => lưu training DDL/Q&A để sinh SQL tốt hơn
    """
    def __init__(self):
        # (1) Khởi tạo Ollama client
        Ollama.__init__(self, config={
            "api_key": OLLAMA_API_KEY,
            "model": OLLAMA_MODEL,
            # Nếu version Vanna của bạn hỗ trợ, thêm luôn:
            "base_url": OLLAMA_BASE_URL,
            "options": {
                "temperature": 0.1,   # rất quan trọng để giảm bịa
                "top_p": 0.9,
                "num_predict": 256,
            },
            "keep_alive": "30m", 
        })

        # (2) Khởi tạo vector store cho training
        os.makedirs(VECTOR_DIR, exist_ok=True)
        ChromaDB_VectorStore.__init__(self, config={
            "path": VECTOR_DIR
        })

        self._additional_sql_prompt = get_additional_sql_prompt()

    @property
    def additional_sql_prompt(self) -> str:
        """
        Cho VannaBase dùng prompt sinh SQL đã custom.
        """
        return self._additional_sql_prompt

    # --------------------- HELPER CHO SCHEMA --------------------- #
    def get_schema_ddl(self, tables: List[str]) -> str:
        ddl_parts = []
        with get_mysql_connection() as conn:
            with conn.cursor() as cur:
                for t in tables:
                    try:
                        cur.execute(f"SHOW CREATE TABLE `{t}`;")
                        row = cur.fetchone()
                        # row lúc này là dict: {"Table": ..., "Create Table": "..."}
                        if row and "Create Table" in row:
                            ddl_parts.append(row["Create Table"] + ";")
                    except Exception as e:
                        print(f"[get_schema_ddl] lỗi khi SHOW CREATE TABLE {t}:", e)
        return "\n\n".join(ddl_parts)

    def train_schema(self, tables: List[str]):
        ddl = self.get_schema_ddl(tables)
        if not ddl.strip():
            print("[train_schema] cảnh báo: không lấy được DDL nào từ MySQL")
        else:
            print("Adding ddl:", ddl[:500], "...")
        # vanna.train(ddl=...) là API hợp lệ hiện tại
        try:
            self.train(ddl=ddl)
        except TypeError:
            # fallback cho các version cũ không nhận keyword:
            self.train(ddl)

    # --------------------- HELPER CHO Q&A + DOC --------------------- #
    def train_qa_pairs(self, qa_pairs_raw):
        """
        Thêm training dưới dạng Q&A để model học mapping NL -> SQL hoặc NL -> DOC.
        Hỗ trợ 2 format:
        1) [ ["Doanh số tháng này?", "SELECT ..."], ["Top 5 ...", "SELECT ..."] ]
        2) [ {"question": "...", "sql": "SELECT ..."}, ... ]
        """
        if not qa_pairs_raw:
            return

        # chuẩn hóa thành list[(q, s)]
        normalized = []

        # trường hợp đọc vào là dict thay vì list
        if isinstance(qa_pairs_raw, dict):
            # ví dụ {"question": "...", "sql": "..."}
            q = qa_pairs_raw.get("question") or qa_pairs_raw.get("q")
            s = qa_pairs_raw.get("sql") or qa_pairs_raw.get("query")
            if q and s:
                normalized.append((q, s))

        elif isinstance(qa_pairs_raw, list):
            for item in qa_pairs_raw:
                if isinstance(item, dict):
                    q = item.get("question") or item.get("q")
                    s = (
                        item.get("sql")
                        or item.get("answer_sql")
                        or item.get("query")
                    )
                    if q and s:
                        normalized.append((q, s))
                elif isinstance(item, (list, tuple)) and len(item) == 2:
                    q, s = item
                    normalized.append((q, s))
                else:
                    print("[train_qa_pairs] bỏ qua item không nhận dạng được:", item)
        else:
            # không hỗ trợ kiểu khác
            print(
                "[train_qa_pairs] qa_pairs_raw không phải list/dict:",
                type(qa_pairs_raw),
            )

        # feed vào Vanna (add_question_sql giúp Vanna nhớ mối quan hệ này)
        for (q, s) in normalized:
            try:
                self.add_question_sql(question=q, sql=s)
            except Exception as e:
                print("[train_qa_pairs] add_question_sql fail:", e, "Q=", q)