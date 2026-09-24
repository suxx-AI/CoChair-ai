import sqlite3

conn = sqlite3.connect("database.db")
cur = conn.cursor()

cur.executescript("""
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;

CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT,
    country TEXT,
    age INTEGER
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    category TEXT,
    price REAL
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    order_date TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
""")

cur.executemany(
    "INSERT INTO customers VALUES (?, ?, ?, ?)",
    [
        (1, "Ahmad", "Jordan", 23),
        (2, "Sara", "UAE", 29),
        (3, "Omar", "Jordan", 35),
        (4, "Lina", "Saudi Arabia", 31),
        (5, "Yousef", "Jordan", 27),
    ]
)

cur.executemany(
    "INSERT INTO products VALUES (?, ?, ?, ?)",
    [
        (1, "Laptop", "Electronics", 950),
        (2, "Headphones", "Electronics", 120),
        (3, "Keyboard", "Electronics", 80),
        (4, "Desk", "Furniture", 300),
        (5, "Chair", "Furniture", 180),
    ]
)

cur.executemany(
    "INSERT INTO orders VALUES (?, ?, ?)",
    [
        (1, 1, "2026-01-10"),
        (2, 2, "2026-01-14"),
        (3, 1, "2026-02-02"),
        (4, 3, "2026-02-11"),
        (5, 4, "2026-03-01"),
        (6, 5, "2026-03-08"),
    ]
)

cur.executemany(
    "INSERT INTO order_items VALUES (?, ?, ?, ?)",
    [
        (1, 1, 1, 1),
        (2, 1, 2, 2),
        (3, 2, 3, 1),
        (4, 2, 5, 2),
        (5, 3, 4, 1),
        (6, 4, 1, 1),
        (7, 4, 3, 2),
        (8, 5, 5, 3),
        (9, 6, 2, 1),
        (10, 6, 3, 1),
    ]
)

conn.commit()
conn.close()

print("Database created.")