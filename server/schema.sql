-- Database Schema for Fresh Produce Market

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer', -- 'customer' or 'admin'
  full_name TEXT,
  phone TEXT,
  address TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Vegetables', 'Fruits', 'Herbs', 'Organic', etc.
  price REAL NOT NULL,
  unit TEXT NOT NULL, -- 'kg', 'bunch', 'piece', 'box'
  stock REAL NOT NULL DEFAULT 0,
  image_url TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'delivery' or 'pickup'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled'
  total_price REAL NOT NULL,
  created_at TEXT NOT NULL,
  delivery_address TEXT,
  delivery_slot TEXT, -- e.g., '9:00 AM - 12:00 PM', etc.
  pickup_time TEXT, -- e.g., '2026-07-21T14:30'
  delivery_distance REAL DEFAULT 0, -- Distance in km (max 30 km allowed)
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  price REAL NOT NULL, -- price snapshot at time of purchase
  FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products (id)
);
