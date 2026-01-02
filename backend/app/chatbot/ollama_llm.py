import os
import time
from typing import List, Dict, Optional
import ollama

class OllamaConfig:
    """
    Cấu hình đơn giản cho việc gọi Ollama.
    Tách riêng model cho phân loại và model cho tóm tắt nếu muốn.
    """

    # URL server Ollama (thường là localhost)
    base_url: str = os.getenv("OLLAMA_BASE_URL")

    # Model dùng cho phân loại câu hỏi (có thể là model nhỏ hơn)
    classify_model: str = os.getenv("OLLAMA_CLASSIFY_MODEL")

    # Model dùng cho câu hỏi chung (general)
    general_model: str = os.getenv("OLLAMA_GENERAL_MODEL")

    # Model dùng cho tóm tắt dữ liệu / trả lời chính
    summary_model: str = os.getenv("OLLAMA_SUMMARY_MODEL")

    # Số token tối đa cho mỗi use-case
    max_tokens_classify: int = int(os.getenv("OLLAMA_CLASSIFY_MAX_TOKENS", "16"))
    max_tokens_summary: int = int(os.getenv("OLLAMA_SUMMARY_MAX_TOKENS", "256"))
    max_tokens_general: int = int(os.getenv("OLLAMA_GENERAL_MAX_TOKENS", "256"))

    # Nhiệt độ thấp để kết quả ổn định, ít “bay”
    temperature: float = float(os.getenv("OLLAMA_TEMPERATURE", "0.1"))

    # Top-p
    top_p: float = float(os.getenv("OLLAMA_TOP_P", "0.9"))

    # Giữ model trong RAM để giảm latency (ví dụ: '30m', '5m')
    keep_alive: str = os.getenv("OLLAMA_KEEP_ALIVE", "30m")

    # Giảm context để nhanh hơn (tùy model)
    num_ctx_classify: int = int(os.getenv("OLLAMA_CLASSIFY_NUM_CTX", "512"))
    num_ctx_summary: int = int(os.getenv("OLLAMA_SUMMARY_NUM_CTX", "1024"))



class OllamaLlm:
    """
    Wrapper gọn nhẹ cho Ollama, tập trung vào 2 nhiệm vụ:
    - classify_question: phân loại câu hỏi
    - summarize_answer: tóm tắt dữ liệu
    """

    def __init__(self, config: Optional[OllamaConfig] = None) -> None:
        self.config = config or OllamaConfig()

        # Cấu hình base_url cho client Ollama (nếu dùng nhiều server)
        # Thư viện ollama hiện hỗ trợ set host qua biến môi trường OLLAMA_HOST.
        os.environ.setdefault("OLLAMA_HOST", self.config.base_url)

    def _chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        num_predict: int,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        num_ctx: Optional[int] = None,
    ) -> str:
        """
        Hàm chat lõi dùng cho cả phân loại & tóm tắt.
        """
        temperature = (
            self.config.temperature if temperature is None else float(temperature)
        )
        top_p = self.config.top_p if top_p is None else float(top_p)

        t0 = time.time()
                # Một số phiên bản ollama-python có/không có tham số keep_alive.
        # Vì vậy gọi theo 2 nhánh để tương thích.
        try:
            res = ollama.chat(
                model=model,
                messages=messages,
                options={
                    "num_predict": num_predict,
                    "temperature": temperature,
                    "top_p": top_p,
                    **({} if not num_ctx else {"num_ctx": int(num_ctx)}),
                },
                keep_alive=self.config.keep_alive,
            )
        except TypeError:
            res = ollama.chat(
                model=model,
                messages=messages,
                options={
                    "num_predict": num_predict,
                    "temperature": temperature,
                    "top_p": top_p,
                    **({} if not num_ctx else {"num_ctx": int(num_ctx)}),
                },
            )
        dt = time.time() - t0
        # Bạn có thể log dt để theo dõi thời gian gọi LLM
        print(f"[OllamaLlm] model={model}, tokens~{num_predict}, time={dt:.2f}s")

        content = res["message"]["content"]
        if not isinstance(content, str):
            content = str(content)
        return content.strip()

    # ------------------------------------------------------------------
    # 1) Phân loại câu hỏi
    # ------------------------------------------------------------------
    def classify_question(self, system_prompt: str, question: str) -> str:
        """
        Gọi LLM để phân loại câu hỏi về 3 label:
        SQL_REQUIRED / DOCUMENTATION / GENERAL.

        - system_prompt: prompt phân loại (get_question_classifier_prompt()).
        - question: câu hỏi tiếng Việt của user.
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ]

        raw = self._chat(
            model=self.config.classify_model,
            messages=messages,
            num_predict=self.config.max_tokens_classify,
            num_ctx=self.config.num_ctx_classify,
        )

        # Lấy label sạch: bỏ khoảng trắng, xuống dòng, chấm
        label = raw.strip().upper()
        label = label.replace(".", "")

        # Chỉ giữ lại 3 giá trị hợp lệ, fallback GENERAL
        if "SQL_REQUIRED" in label:
            return "SQL_REQUIRED"
        if "DOCUMENTATION" in label:
            return "DOCUMENTATION"
        if "GENERAL" in label:
            return "GENERAL"

        # Nếu model trả lời linh tinh, mặc định coi là GENERAL
        return "GENERAL"

    # ------------------------------------------------------------------
    # 2) Tóm tắt / trả lời dựa trên dữ liệu
    # ------------------------------------------------------------------
    def summarize_answer(
        self,
        system_prompt: str,
        question: str,
        data_json: str,
        *,
        extra_instructions: Optional[str] = None,
    ) -> str:
        """
        Gọi LLM để tóm tắt kết quả dựa trên:
        - system_prompt: prompt tóm tắt (get_additional_summary_prompt()).
        - question: câu hỏi gốc của user.
        - data_json: dữ liệu JSON (đã convert từ DataFrame).
        """
        user_content = (
            f"Câu hỏi của người dùng:\n{question}\n\n"
            f"Dữ liệu JSON trả về từ truy vấn:\n{data_json}\n"
        )
        if extra_instructions:
            user_content += f"\nHướng dẫn bổ sung cho câu trả lời:\n{extra_instructions}\n"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        answer = self._chat(
            model=self.config.summary_model,
            messages=messages,
            num_predict=self.config.max_tokens_summary,
            num_ctx=self.config.num_ctx_summary,
        )
        return answer
    
    def reply_general(self, system_prompt: str, question: str) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ]
        return self._chat(
            model=self.config.classify_model,   # model nhỏ
            messages=messages,
            num_predict=64,                     # token thấp
            num_ctx=self.config.num_ctx_classify,
            temperature=0.2,
        )

