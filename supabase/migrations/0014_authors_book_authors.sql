-- 정규화된 저자(`authors`)와 도서-저자 다대다(`book_authors`).
-- `books.authors` text[] 는 트리거로 `book_authors`와 동기화(기존 RPC·검색 유지).

create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists authors_name_normalized_unique
  on public.authors ((lower(trim(btrim(name)))));

comment on table public.authors is '공유 서지용 저자 마스터 (표시명 기준 정규화)';
comment on column public.authors.name is '표시용 이름 (앞뒤 공백 제거 권장)';

drop trigger if exists set_authors_updated_at on public.authors;
create trigger set_authors_updated_at
  before update on public.authors
  for each row execute procedure public.set_updated_at();

create table if not exists public.book_authors (
  book_id uuid not null references public.books (id) on delete cascade,
  author_id uuid not null references public.authors (id) on delete restrict,
  position int not null default 0,
  primary key (book_id, author_id)
);

create index if not exists idx_book_authors_author_id on public.book_authors (author_id);
create index if not exists idx_book_authors_book_id_position on public.book_authors (book_id, position);

comment on table public.book_authors is '도서(books)와 저자(authors) 다대다, position은 표시 순서';

-- 저자 확보(이름 정규화 키로 중복 방지)
create or replace function public.ensure_author(p_name text)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_trim text := trim(btrim(p_name));
  v_id uuid;
begin
  if v_trim = '' then
    return null;
  end if;

  select id into v_id
  from public.authors
  where lower(trim(btrim(name))) = lower(v_trim)
  limit 1;

  if found then
    return v_id;
  end if;

  begin
    insert into public.authors (name) values (v_trim) returning id into v_id;
    return v_id;
  exception
    when unique_violation then
      select id into v_id
      from public.authors
      where lower(trim(btrim(name))) = lower(v_trim)
      limit 1;
      return v_id;
  end;
end;
$$;

-- 도서의 저자 링크 전체 교체 → 트리거가 books.authors 갱신
create or replace function public.replace_book_author_links(p_book_id uuid, p_names text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i int;
  v_name text;
  v_author_id uuid;
  v_ord int := 0;
  v_seen uuid[] := array[]::uuid[];
begin
  if p_book_id is null then
    return;
  end if;

  delete from public.book_authors where book_id = p_book_id;

  for i in 1..coalesce(array_length(p_names, 1), 0) loop
    v_name := trim(btrim(p_names[i]));
    if v_name = '' then
      continue;
    end if;

    v_author_id := public.ensure_author(v_name);
    if v_author_id is null then
      continue;
    end if;

    if v_author_id = any (v_seen) then
      continue;
    end if;
    v_seen := array_append(v_seen, v_author_id);

    insert into public.book_authors (book_id, author_id, position)
    values (p_book_id, v_author_id, v_ord);
    v_ord := v_ord + 1;
  end loop;
end;
$$;

create or replace function public.sync_books_authors_from_book_authors()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  bid uuid;
begin
  if tg_op = 'DELETE' then
    bid := old.book_id;
  else
    bid := new.book_id;
  end if;

  update public.books
  set authors = coalesce(
    (
      select array_agg(a.name order by ba.position, ba.author_id)
      from public.book_authors ba
      inner join public.authors a on a.id = ba.author_id
      where ba.book_id = bid
    ),
    '{}'::text[]
  )
  where id = bid;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_book_authors_sync_books_array on public.book_authors;
create trigger trg_book_authors_sync_books_array
  after insert or update or delete on public.book_authors
  for each row execute procedure public.sync_books_authors_from_book_authors();

create or replace function public.sync_books_after_author_name_change()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  r record;
begin
  if tg_op = 'UPDATE' and new.name is not distinct from old.name then
    return new;
  end if;

  for r in
    select distinct ba.book_id as bid
    from public.book_authors ba
    where ba.author_id = new.id
  loop
    update public.books b
    set authors = coalesce(
      (
        select array_agg(a.name order by ba2.position, ba2.author_id)
        from public.book_authors ba2
        inner join public.authors a on a.id = ba2.author_id
        where ba2.book_id = r.bid
      ),
      '{}'::text[]
    )
    where b.id = r.bid;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_authors_name_sync_books on public.authors;
create trigger trg_authors_name_sync_books
  after update of name on public.authors
  for each row execute procedure public.sync_books_after_author_name_change();

-- 기존 books.authors 배열에서 마스터·링크 백필
insert into public.authors (name)
select x.nm
from (
  select distinct trim(btrim(v)) as nm
  from public.books b
  cross join lateral unnest(coalesce(b.authors, '{}'::text[])) as u(v)
  where trim(btrim(v)) <> ''
) x
where not exists (
  select 1
  from public.authors a
  where lower(trim(btrim(a.name))) = lower(trim(btrim(x.nm)))
);

insert into public.book_authors (book_id, author_id, position)
select b.id, au.id, (t.ord - 1)::int
from public.books b
cross join lateral unnest(coalesce(b.authors, '{}'::text[])) with ordinality as t(name, ord)
inner join public.authors au on lower(trim(btrim(au.name))) = lower(trim(btrim(t.name)))
where trim(btrim(t.name)) <> ''
on conflict (book_id, author_id) do nothing;

alter table public.authors enable row level security;
alter table public.book_authors enable row level security;

drop policy if exists "Authors are authenticated readable" on public.authors;
create policy "Authors are authenticated readable"
  on public.authors for select
  using (auth.role() = 'authenticated');

drop policy if exists "Book authors are authenticated readable" on public.book_authors;
create policy "Book authors are authenticated readable"
  on public.book_authors for select
  using (auth.role() = 'authenticated');

revoke all on function public.ensure_author(text) from public;
grant execute on function public.ensure_author(text) to service_role;

revoke all on function public.replace_book_author_links(uuid, text[]) from public;
grant execute on function public.replace_book_author_links(uuid, text[]) to service_role;
