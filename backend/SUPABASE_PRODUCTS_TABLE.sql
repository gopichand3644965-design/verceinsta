-- Supabase products table definition
-- Run this SQL in the Supabase SQL editor for your project.

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- Optional index for faster lookups by id
CREATE INDEX IF NOT EXISTS idx_products_id ON products(id);
