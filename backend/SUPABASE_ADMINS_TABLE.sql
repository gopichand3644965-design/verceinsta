-- Supabase admins table schema for secure admin authentication

create table if not exists admins (
  id text primary key,
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

create policy "admins can be selected by service role" on admins
  for select
  using (auth.role() = 'service_role');

create policy "admins can be inserted by service role" on admins
  for insert
  with check (auth.role() = 'service_role');

create policy "admins can be updated by service role" on admins
  for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "admins can be deleted by service role" on admins
  for delete
  using (auth.role() = 'service_role');
