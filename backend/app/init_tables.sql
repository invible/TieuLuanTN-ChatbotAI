-- Nên chọn database trước
-- USE your_database_name;

-- Đảm bảo dùng InnoDB + utf8mb4
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(40) NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(40) NOT NULL,
    role VARCHAR(40) NOT NULL,
    status VARCHAR(40) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(40) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(40) NOT NULL,
    representative VARCHAR(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(40) NOT NULL UNIQUE,
    origin TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(40) NOT NULL UNIQUE,
    description TEXT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    unit VARCHAR(40) NOT NULL,
    packaging VARCHAR(40) NULL,
    image_url VARCHAR(255) NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    category_id INT,
    brand_id INT,
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_products_brand
        FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_date DATETIME NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    note VARCHAR(100) NULL,
    payment_method VARCHAR(40) NOT NULL,
    status VARCHAR(40) DEFAULT 'completed',
    user_id INT,
    customer_id INT,
    KEY idx_orders_user_id (user_id),
    KEY idx_orders_customer_id (customer_id),
    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    order_id INT,
    product_id INT,
    KEY idx_order_items_order_id (order_id),
    KEY idx_order_items_product_id (product_id),
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    create_date DATETIME NOT NULL,
    approval_date DATETIME NULL,
    approval_person VARCHAR(40) NULL,
    note VARCHAR(100) NULL,
    status VARCHAR(40) DEFAULT 'completed',
    supplier_id INT,
    user_id INT,
    KEY idx_receipts_supplier_id (supplier_id),
    KEY idx_receipts_user_id (user_id),
    CONSTRAINT fk_receipts_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_receipts_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS receipt_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    receipt_id INT,
    product_id INT,
    KEY idx_receipt_items_receipt_id (receipt_id),
    KEY idx_receipt_items_product_id (product_id),
    CONSTRAINT fk_receipt_items_receipt
        FOREIGN KEY (receipt_id) REFERENCES receipts(id),
    CONSTRAINT fk_receipt_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    session_id TEXT NOT NULL,
    status VARCHAR(40) DEFAULT 'active',
    user_id INT,
    KEY idx_chat_sessions_user_id (user_id),
    CONSTRAINT fk_chat_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    send_time DATETIME NOT NULL,
    send_name VARCHAR(40) NULL,
    question TEXT NOT NULL,
    sql_generate TEXT NOT NULL,
    answer TEXT NOT NULL,
    user_id INT,
    session_id INT,
    KEY idx_chat_messages_user_id (user_id),
    KEY idx_chat_messages_session_id (session_id),
    CONSTRAINT fk_chat_messages_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_chat_messages_session
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);

SET FOREIGN_KEY_CHECKS = 1;
