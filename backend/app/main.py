from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from pathlib import Path

from app.chatbot import router as chatbot_router
from app.routers import (
    dashboard,
    auth,
    categories,
    brands,
    products,
    orders,
    order_items,
    reports,
    users,
    customers,
    receipt,
    suppliers
)

app = FastAPI()

origins = [
    "http://localhost:5173",  # Vite

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # hoặc ["*"] để cho phép tất cả các nguồn
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(customers.router)
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(brands.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(order_items.router)
app.include_router(reports.router)
app.include_router(receipt.router)
app.include_router(suppliers.router)
app.include_router(chatbot_router.router)

BASE_DIR = Path(__file__).resolve().parent   # backend/app
STATIC_DIR = BASE_DIR / "static"

# mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")