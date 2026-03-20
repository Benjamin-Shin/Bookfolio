-- App-owned user identities for NextAuth (decoupled from auth.users).
-- Existing profiles (same id as former auth.users) are copied so user_books FK can be repointed.

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  email_verified timestamptz,
  password_hash text,
  name text,
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_users_email on public.app_users (lower(email));

-- Preserve existing user ids from profiles so current user_books rows stay valid
insert into public.app_users (id, email, name, image, email_verified)
select p.id, p.email, p.display_name, p.avatar_url, now()
from public.profiles p
on conflict (id) do nothing;

alter table public.user_books drop constraint if exists user_books_user_id_fkey;

alter table public.user_books
  add constraint user_books_user_id_fkey
  foreign key (user_id) references public.app_users (id) on delete cascade;

drop trigger if exists set_app_users_updated_at on public.app_users;
create trigger set_app_users_updated_at
  before update on public.app_users
  for each row execute procedure public.set_updated_at();

alter table public.app_users enable row level security;
-- No policies: anon/authenticated cannot access; service_role bypasses RLS.

comment on table public.app_users is 'NextAuth identities; rows created on email signup or Google OAuth.';
