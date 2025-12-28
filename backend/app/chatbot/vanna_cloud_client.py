import os
import hashlib
from typing import List, Optional

import pymysql

from .config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, TABLES

try:
    # Vanna Hosted (Cloud) client
    from vanna.remote import VannaDefault
except Exception as e:
    VannaDefault = None
    _vanna_import_error = e
else:
    _vanna_import_error = None


class VannaCloudClient:
    """Thin wrapper for Vanna Cloud used ONLY for SQL generation/training.

    Design goal:
    - Use Vanna Cloud to generate SQL (accuracy + token efficiency).
    - Keep DB execution local (you already do this in VannaChatFlow.run_sql).
    """

    def __init__(self, model: Optional[str] = None, api_key: Optional[str] = None) -> None:
        if VannaDefault is None:
            raise ImportError(
                "Không import được 'from vanna.remote import VannaDefault'. " 
                "Hãy kiểm tra version thư viện vanna (khuyến nghị cài 'pip install -U vanna')."
            ) from _vanna_import_error

        self.model = model or os.getenv("VANNA_MODEL")
        self.api_key = api_key or os.getenv("VANNA_API_KEY")

        if not self.model or not self.api_key:
            raise ValueError(
                "Thiếu cấu hình VANNA_MODEL hoặc VANNA_API_KEY (trong .env). "
                "Bạn có thể lấy ở trang profile/account của Vanna."
            )

        # Cloud model instance
        self.vn = VannaDefault(model=self.model, api_key=self.api_key)

        # local lock to avoid re-train schema every server restart
        self._schema_lock_path = os.getenv("VANNA_SCHEMA_LOCK", ".vanna_schema.lock")

    # --------------------- MySQL schema helpers --------------------- #
    def _mysql_conn(self):
        return pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )

    def get_schema_ddl(self, tables: Optional[List[str]] = None) -> str:
        tables = tables or TABLES
        ddl_parts: List[str] = []
        with self._mysql_conn() as conn:
            with conn.cursor() as cur:
                for t in tables:
                    cur.execute(f"SHOW CREATE TABLE `{t}`;")
                    row = cur.fetchone()
                    # SHOW CREATE TABLE returns dict like {'Table': 'x', 'Create Table': 'CREATE TABLE ...'}
                    create_stmt = row.get("Create Table") if isinstance(row, dict) else None
                    if create_stmt:
                        ddl_parts.append(create_stmt + ";")
        return "\n\n".join(ddl_parts)

    def _schema_fingerprint(self, ddl: str) -> str:
        return hashlib.sha256(ddl.encode("utf-8")).hexdigest()

    def train_schema_once(self, tables: Optional[List[str]] = None, *, force: bool = False) -> None:
        """Push DDL to Vanna Cloud only when schema changes (token/cost saver)."""
        ddl = self.get_schema_ddl(tables=tables)
        if not ddl.strip():
            return

        fp = self._schema_fingerprint(ddl)

        if not force and os.path.exists(self._schema_lock_path):
            try:
                old = open(self._schema_lock_path, "r", encoding="utf-8").read().strip()
                if old == fp:
                    return
            except Exception:
                pass

        # Train: add_ddl is a light-weight call; you can also use vn.train(ddl=ddl)
        self.vn.add_ddl(ddl)

        try:
            with open(self._schema_lock_path, "w", encoding="utf-8") as f:
                f.write(fp)
        except Exception:
            # non-fatal
            pass

    # --------------------- SQL Generation --------------------- #
    def generate_sql(self, question: str) -> str:
        """Generate SQL using Vanna Cloud."""
        return self.vn.generate_sql(question=question)
