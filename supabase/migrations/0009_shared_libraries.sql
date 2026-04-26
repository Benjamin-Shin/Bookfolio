-- 모임서가: 가족·모임 등. 물리적 한 권(library_books) + 멤버별 읽기 상태(library_book_member_states).
-- 개인 서가(user_books)와는 별도(A안). API(service role)에서 멤버십 검증.

create table if not exists public.libraries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  kind text not null check (kind in ('family', 'club')),
  created_by uuid not null references public.app_users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_libraries_created_by on public.libraries (created_by);

create table if not exists public.library_members (
  library_id uuid not null references public.libraries (id) on delete cascade,
  user_id uuid not null references public.app_users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (library_id, user_id)
);

create index if not exists idx_library_members_user_id on public.library_members (user_id);

create table if not exists public.library_books (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete restrict,
  location text,
  memo text,
  added_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_library_books_library_id on public.library_books (library_id);
create index if not exists idx_library_books_book_id on public.library_books (book_id);

create table if not exists public.library_book_member_states (
  library_book_id uuid not null references public.library_books (id) on delete cascade,
  user_id uuid not null references public.app_users (id) on delete cascade,
  reading_status text not null default 'unread'
    check (reading_status in ('unread', 'reading', 'completed', 'paused', 'dropped')),
  updated_at timestamptz not null default now(),
  primary key (library_book_id, user_id)
);

create index if not exists idx_library_book_member_states_user_id
  on public.library_book_member_states (user_id);

drop trigger if exists set_libraries_updated_at on public.libraries;
create trigger set_libraries_updated_at
  before update on public.libraries
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_library_books_updated_at on public.library_books;
create trigger set_library_books_updated_at
  before update on public.library_books
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_library_book_member_states_updated_at on public.library_book_member_states;
create trigger set_library_book_member_states_updated_at
  before update on public.library_book_member_states
  for each row execute procedure public.set_updated_at();

alter table public.libraries enable row level security;
alter table public.library_members enable row level security;
alter table public.library_books enable row level security;
alter table public.library_book_member_states enable row level security;

-- NextAuth 기반 앱은 주로 service_role로 접근합니다. authenticated 직접 접근 시에는 정책 없음 = 거부(app_users와 동일 패턴).
-- 멤버십 검증은 API 레이어에서 수행합니다.

comment on table public.libraries is '모임서가(가족·모임 등).';
comment on table public.library_members is '모임서가 멤버 및 역할(owner/member).';
comment on table public.library_books is '해당 서가 안의 물리적 한 권(공유 카탈로그 books 참조).';
comment on table public.library_book_member_states is '모임서가 책에 대한 멤버별 읽기 상태.';
