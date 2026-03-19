create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  isbn text unique,
  title text not null,
  authors text[] not null default '{}',
  publisher text,
  published_date text,
  cover_url text,
  description text,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  isbn text,
  title text not null,
  authors text[] not null default '{}',
  format text not null check (format in ('paper', 'ebook')),
  reading_status text not null default 'unread' check (reading_status in ('unread', 'reading', 'completed', 'paused', 'dropped')),
  rating int check (rating between 1 and 5),
  memo text,
  cover_url text,
  publisher text,
  published_date text,
  description text,
  is_owned boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_books_user_id on public.user_books(user_id);
create index if not exists idx_user_books_status on public.user_books(user_id, reading_status);
create index if not exists idx_user_books_format on public.user_books(user_id, format);

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_auth_user_created();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_books_updated_at on public.books;
create trigger set_books_updated_at
  before update on public.books
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_user_books_updated_at on public.user_books;
create trigger set_user_books_updated_at
  before update on public.user_books
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_books enable row level security;
alter table public.books enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are updateable by owner" on public.profiles;
create policy "Profiles are updateable by owner"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "User books are owner readable" on public.user_books;
create policy "User books are owner readable"
  on public.user_books for select
  using (auth.uid() = user_id);

drop policy if exists "User books are owner writable" on public.user_books;
create policy "User books are owner writable"
  on public.user_books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Books are authenticated readable" on public.books;
create policy "Books are authenticated readable"
  on public.books for select
  using (auth.role() = 'authenticated');

