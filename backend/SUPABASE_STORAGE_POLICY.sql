-- =============================================================================
-- Supabase Storage Policies for the 'products' bucket
-- Run this ENTIRE script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- Navigate to: SQL Editor > New Query > Paste & Run
-- =============================================================================

-- Step 1: Allow anyone to READ files from the products bucket (public images)
CREATE POLICY "Allow public read access on products bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'products');

-- Step 2: Allow anyone to UPLOAD files to the products bucket
-- This is needed because the backend may use the anon key instead of service role key
CREATE POLICY "Allow public uploads to products bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'products');

-- Step 3: Allow anyone to UPDATE files in the products bucket
CREATE POLICY "Allow public updates to products bucket"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'products');

-- Step 4: Allow anyone to DELETE files from the products bucket
CREATE POLICY "Allow public deletes from products bucket"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'products');

-- =============================================================================
-- IF THE ABOVE FAILS with "policy already exists" errors, run these DROP
-- statements first, then re-run the CREATE statements above:
-- =============================================================================
-- DROP POLICY IF EXISTS "Allow public read access on products bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public uploads to products bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public updates to products bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public deletes from products bucket" ON storage.objects;
