-- Run this in the Supabase SQL Editor to allow anonymous image uploads to the products bucket
CREATE POLICY "Allow public uploads to products bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'products');

-- Optional: Allow public updates and deletes if needed
CREATE POLICY "Allow public updates to products bucket"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'products');

CREATE POLICY "Allow public deletes from products bucket"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'products');
