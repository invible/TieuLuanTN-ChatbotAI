import os
from vanna.remote import VannaDefault

vn = VannaDefault(model=os.getenv("VANNA_MODEL"), api_key=os.getenv("VANNA_API_KEY"))
email = os.getenv("VANNA_EMAIL")

# quan trọng: thử truyền email
sql = vn.generate_sql(
    question="top 5 sản phẩm bán chạy nhất",
    email=email,
)
print(sql)
