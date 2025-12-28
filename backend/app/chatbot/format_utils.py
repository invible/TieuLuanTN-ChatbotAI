import pandas as pd
import base64
import json

def split_base64_from_df(df: pd.DataFrame):
    """
    Tách các cột chứa ảnh base64 ra khỏi DataFrame.
    Trả về:
        - df_clean: DataFrame đã loại bỏ hoặc thay thế ảnh bằng placeholder
        - base64_images: list chứa (cột, giá trị base64)
    """
    if df is None or df.empty:
        return df, []

    df_clean = df.copy()
    base64_images = []

    for col in df.columns:
        # Phát hiện base64 bằng pattern đơn giản
        if df[col].dtype == object and df[col].astype(str).str.startswith("data:image").any():
            for idx, val in df[col].items():
                if isinstance(val, str) and val.startswith("data:image"):
                    base64_images.append({
                        "column": col,
                        "row": idx,
                        "base64": val
                    })
                    # Thay bằng placeholder để gửi JSON gọn hơn
                    df_clean.at[idx, col] = "[IMAGE_BASE64]"

    return df_clean, base64_images


def format_dataframe(df: pd.DataFrame) -> str:
    """
    Chuẩn hóa DataFrame → dạng JSON để trả cho frontend hoặc LLM.
    - Hỗ trợ chuyển datetime → string
    - Giảm lỗi kiểu dữ liệu không serialize được
    """
    if df is None or df.empty:
        return json.dumps([], ensure_ascii=False)

    # Convert datetime
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.strftime("%Y-%m-%d")

    # Convert Decimal, numpy types → Python primitive
    df_clean = df.copy().applymap(lambda x:
        float(x)
        if isinstance(x, (pd._libs.missing.NAType, float, int))
        else (
            str(x)
        )
    )

    # Trả về JSON
    return df_clean.to_json(orient="records", force_ascii=False)
