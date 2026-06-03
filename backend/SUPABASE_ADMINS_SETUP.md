# Admin Authentication Setup for Supabase

## Create the admins table

Run the SQL in `SUPABASE_ADMINS_TABLE.sql` in your Supabase SQL editor.

This creates a secure `admins` table with fields:
- `id`
- `name`
- `email`
- `password_hash`
- `role`
- `created_at`

## Environment variables

The backend uses the following environment variables:

- `SUPABASE_URL`
- `SUPABASE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (set to a strong secret in production)
- `JWT_EXPIRES_IN` (optional, defaults to `2h`)

## Creating an admin record

Use a bcrypt hash for the password. Example SQL:

```sql
insert into admins (id, name, email, password_hash, role)
values (
  'admin-1',
  'Super Admin',
  'admin@pandasstore.com',
  '$2b$10$...bcrypt hash...',
  'owner'
);
```

For local development, the backend also provides a fallback admin seed at `backend/data/admins.json`.

## Notes

- Passwords are never stored in plain text.
- Login uses a JWT token returned by `/api/admin/login`.
- Protected API routes require an `Authorization: Bearer <token>` header.
