from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date


# ======================
#  USERS
# ======================

class UserBase(BaseModel):
    username: str
    date_of_birth: date
    gender: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: EmailStr
    role: str
    status: Optional[str] = "active"


class UserCreate(UserBase):
    # Ở đây mình để client gửi sẵn password_hash,
    # sau này bạn có thể đổi thành gửi password rồi hash trong backend
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    status: Optional[str] = None


class UserOut(UserBase):
    id: int
    created_at: datetime | None = None

    class Config:
        orm_mode = True

# ======================
#  LOGINS
# ======================
class LoginBase(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    access_token: str | None = None   # nếu sau này dùng JWT
    token_type: str = "bearer"

class LoginRequest(LoginBase):
    pass

# ======================
#  PRODUCTS
# ======================

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    unit: Optional[str] = None
    packaging: Optional[str] = None
    image_url: Optional[str] = None
    purchase_price: float
    selling_price: float
    stock: int = 0
    category_id: int
    brand_id: int

class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    packaging: Optional[str] = None
    image_url: Optional[str] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    stock: Optional[int] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None

class ProductOut(ProductBase):
    id: int
    category_name: Optional[str] = None
    brand_name: Optional[str] = None

    class Config:
        orm_mode = True

class ProductList(BaseModel):
  items: List[ProductOut]
  total: int

# ========== CATEGORIES ==========
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class CategoryOut(CategoryBase):
    id: int

    class Config:
        orm_mode = True

# ======================
#  BRANDS
# ======================
class BrandBase(BaseModel):
    name: str
    origin: Optional[str] = None

class BrandCreate(BrandBase):
    pass

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    origin: Optional[str] = None

class BrandOut(BrandBase):
    id: int

    class Config:
        orm_mode = True

# ======================
#  ORDERS
# ======================

class OrderBase(BaseModel):
    user_id: int
    customer_id: int
    order_date: datetime
    total_amount: float
    note: Optional[str] = None
    payment_method: str
    status: Optional[str] = "completed"

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    user_id: Optional[int] = None
    customer_id: Optional[int] = None
    order_date: Optional[datetime] = None
    total_amount: Optional[float] = None
    note: Optional[str] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None

class OrderOut(OrderBase):
    id: int
    created_at: datetime | None = None

    class Config:
        orm_mode = True

# ======================
#  ORDER ITEMS
# ======================

class OrderItemBase(BaseModel):
    order_id: int
    product_id: int
    quantity: int
    unit_price: float
    discount: Optional[float] = 0.0

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemOut(OrderItemBase):
    id: int

    class Config:
        orm_mode = True

# ======================
#  CUSTOMERS
# ======================
class CustomerBase(BaseModel):
    name: str
    date_of_birth: date
    gender: str
    address: str
    phone: str

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

class CustomerOut(CustomerBase):
    id: int
    order_count: int = 0

    class Config:
        orm_mode = True


# ======================
# RECEIPT ITEMS
# ======================

class ReceiptItemBase(BaseModel):
    receipt_id: int
    product_id: int
    quantity: int
    unit_price: float

class ReceiptItemCreate(ReceiptItemBase):
    pass

class ReceiptItemOut(ReceiptItemBase):
    id: int
    receipt_id: int

    class Config:
        orm_mode = True

# ======================
# SUPPLIERS
# ======================
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    pass

class SupplierOut(SupplierBase):
    id: int

    class Config:
        orm_mode = True

# ======================
# RECEIPTS
# ======================

class ReceiptBase(BaseModel):
    create_date: datetime
    approval_date: Optional[datetime] = None
    approval_person: Optional[str] = None
    note: Optional[str] = None
    status: Optional[str] = "completed"
    supplier_id: int
    user_id: Optional[int] = None

class ReceiptCreate(ReceiptBase):
    items: List[ReceiptItemCreate]

class ReceiptUpdate(BaseModel):
    create_date: Optional[datetime] = None
    approval_date: Optional[datetime] = None
    approval_person: Optional[str] = None
    note: Optional[str] = None
    status: Optional[str] = None
    supplier_id: Optional[int] = None
    user_id: Optional[int] = None

    # Cho phép client gửi lại full list items khi update
    items: Optional[List[ReceiptItemCreate]] = None

class ReceiptOut(ReceiptBase):
    id: int
    create_date: datetime
    approval_date: Optional[datetime] = None
    approval_person: Optional[str] = None
    note: Optional[str] = None
    status: Optional[str] = None

    supplier_id: int
    user_id: int

    # embed dữ liệu liên quan:
    # chú ý: model Receipt đang để relationship là "suppliers"
    # nên tên field ở đây cũng là "suppliers"
    suppliers: Optional[SupplierOut] = None
    receipt_items: List[ReceiptItemOut] = []

    class Config:
        orm_mode = True

# ======================
# DASHBOARD
# ======================
class StatSummary(BaseModel):
    revenue: float
    sales: int
    customers: int
    bounce_rate: float

class SalesPoint(BaseModel):
    month: str
    sales: float
    revenue: float

class TrafficSource(BaseModel):
    name: str
    value: int

class RecentActivity(BaseModel):
    title: str
    description: str
    time: str

class TopProduct(BaseModel):
    key: int
    product: str
    sales: int
    revenue: float
    status: str

class DashboardOverview(BaseModel):
    stats: StatSummary
    sales_overview: List[SalesPoint]
    traffic_sources: List[TrafficSource]
    recent_activities: List[RecentActivity]
    top_products: List[TopProduct]

# ======================
# CHATBOT
# ======================
class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str