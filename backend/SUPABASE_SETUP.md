# Supabase Setup Guide

This backend is now configured to use Supabase PostgreSQL for persistent product storage.

## Prerequisites

- Supabase account (free at https://supabase.com)
- Your Supabase project API credentials

## Setup Steps

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Enter your project name (e.g., "fullwb")
4. Set a strong database password
5. Select your region (closest to your users)
6. Click "Create new project" and wait for initialization (2-3 minutes)

### 2. Create the Products Table

1. Once your project is created, go to the **SQL Editor** section
2. Click "New query"
3. Paste the following SQL and run it:

```sql
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_id ON products(id);
```

4. You should see "Success: 1 row affected"

> If your backend logs show this error:
> `Could not find the table 'public.products' in the schema cache`
> then the `products` table is missing in Supabase.
> Run the SQL above in the Supabase SQL editor or use `backend/SUPABASE_PRODUCTS_TABLE.sql`.

### 3. Get Your API Credentials

1. Go to **Settings** → **API**
2. Copy your **Project URL** (looks like: `https://xxxx.supabase.co`)
3. Copy your **Anon Key** (the public anonymous key - it's safe to use in frontend if RLS is configured)
4. (Optional) For additional security, use the **Service Role Key** in backend instead of Anon Key

### 4. Configure Environment Variables

1. In the `backend/` folder, create a `.env` file (copy from `.env.example`):

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anonymous-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here  # optional for backend seed/write operations when RLS is enabled
PORT=4000
```

2. Replace the values with your actual Supabase credentials from step 3

### 5. (Optional) Enable Row Level Security (RLS)

For production, enable RLS on the products table:

1. Go to **Authentication** → **Policies**
2. Click on "products" table
3. Create policies:
   - **SELECT**: `public` (allow all reads)
   - **INSERT/UPDATE/DELETE**: `authenticated` (allow only admin/authenticated users)

This prevents unauthorized modifications from the frontend.

### 6. Restart Backend

```bash
npm start
```

You should see:
```
Products DB initialized and connected.
Backend running on http://localhost:4000
```

### 7. Test the Connection

Create a test product via curl/Postman:

```bash
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TEST-001",
    "productCode": "TEST",
    "title": "Test Product",
    "price": 99,
    "discount": 10,
    "rating": 5,
    "image": "test.jpg",
    "colors": ["red", "blue"],
    "sizes": ["M", "L"],
    "description": "Test"
  }'
```

Then verify it appears in Supabase:
1. Go to **Table Editor** in Supabase dashboard
2. Click "products" table
3. You should see your test product

## Fallback Behavior

If Supabase credentials are not provided or the database is unavailable:
- The backend will log a warning
- Products will be read from `backend/data/products.json`
- Products added via the admin panel will NOT persist between restarts
- This is useful for offline development/testing

## Troubleshooting

**Issue**: "Products table does not exist"
- **Solution**: Make sure you ran the SQL from step 2 in your Supabase project

**Issue**: "Products DB not available, falling back to JSON storage"
- **Solution**: Check that `SUPABASE_URL` and `SUPABASE_KEY` are correctly set in `.env`
- **Solution**: Verify your API key is valid in Supabase dashboard

**Issue**: "Products created in admin panel not visible"
- **Solution**: Make sure RLS is disabled or you have the correct policies enabled
- **Solution**: Verify data appears in Supabase Table Editor

## Security Notes

- **SUPABASE_KEY**: Use the "Anon Key" (safe for public/browser use if RLS is configured)
- **SERVICE_ROLE_KEY**: Use this only in backend if you need to bypass RLS
- **Never commit `.env`** to version control - it's already in `.gitignore`
- Enable RLS policies for production to prevent unauthorized access

## Seeding Data

On first run, the backend will automatically seed the products from `backend/data/products.json` into Supabase if the products table is empty.

To manually reseed:
1. Clear the products table in Supabase dashboard
2. Restart the backend
3. It will reload products from the JSON file

## Migrating from Local PostgreSQL

If you were using local PostgreSQL before:
1. Export your products from local PostgreSQL (or they'll be seeded from `backend/data/products.json`)
2. Set up Supabase following steps 1-4 above
3. Restart the backend with new `.env` settings
4. The backend will automatically migrate data

## Production Deployment

When deploying to production:
1. Update `SUPABASE_URL` and `SUPABASE_KEY` in your hosting provider's environment variables
2. Use Supabase's built-in backup features
3. Enable RLS policies for security
4. Monitor API quota on Supabase dashboard (free tier has generous limits)
5. Consider using SERVICE_ROLE_KEY in a secure backend instead of Anon Key
