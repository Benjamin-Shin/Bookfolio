-- 공동서가: 개인 소장(user_books)을 서가에 연결하는 매핑. library_books / library_book_member_states 제거.

create table if not exists public.library_user_books (
  library_id uuid not null references public.libraries (id) on delete cascade,
  user_book_id uuid not null references public.user_books (id) on delete cascade,
  linked_at timestamptz not null default now(),
  linked_by uuid references public.app_users (id) on delete set null,
  primary key (library_id, user_book_id)
);

create index if not exists idx_library_user_books_library_id
  on public.library_user_books (library_id);

create index if not exists idx_library_user_books_user_book_id
  on public.library_user_books (user_book_id);

comment on table public.library_user_books is '공동서가에 노출할 user_books 행(멤버별 선택 공유).';

-- 기존 library_books → 매핑 백필 (added_by + book_id로 개인 소장 행 매칭, 동일 다건 시 최근 updated_at 우선)
insert into public.library_user_books (library_id, user_book_id, linked_at, linked_by)
select distinct on (lb.id)
  lb.library_id,
  ub.id,
  coalesce(lb.created_at, now()),
  lb.added_by
from public.library_books lb
inner join public.user_books ub
  on ub.user_id = lb.added_by
  and ub.book_id = lb.book_id
where lb.added_by is not null
order by lb.id, ub.updated_at desc
on conflict (library_id, user_book_id) do nothing;

drop table if exists public.library_book_member_states;
drop table if exists public.library_books;

alter table public.library_user_books enable row level security;
