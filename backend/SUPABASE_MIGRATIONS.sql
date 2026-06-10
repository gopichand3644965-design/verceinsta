-- Supabase SQL Migration Script for Full-Stack E-commerce Project
-- Run this SQL query script inside the SQL Editor of your Supabase dashboard.

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_id ON products(id);

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on Admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins can be selected by service role" ON admins;
CREATE POLICY "admins can be selected by service role" ON admins
  FOR SELECT USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admins can be inserted by service role" ON admins;
CREATE POLICY "admins can be inserted by service role" ON admins
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admins can be updated by service role" ON admins;
CREATE POLICY "admins can be updated by service role" ON admins
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admins can be deleted by service role" ON admins;
CREATE POLICY "admins can be deleted by service role" ON admins
  FOR DELETE USING (auth.role() = 'service_role');

-- 3. Banners Table
CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_token TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'Placed',
  shipping JSONB NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer_token ON orders(customer_token);

-- 5. Customers Table (Profile, Cart, Wishlist, Addresses, Settings)
CREATE TABLE IF NOT EXISTS customers (
  customer_token TEXT PRIMARY KEY,
  profile JSONB DEFAULT '{}'::jsonb,
  addresses JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  cart JSONB DEFAULT '[]'::jsonb,
  wishlist JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
