-- user_books: 소유자 전용(형식·상태·메모·위치 등), 서지 메타는 books에서만
-- 1) 위치(집/회사/빌려줌 등 자유 입력)
alter table public.user_books
  add column if not exists location text;

comment on column public.user_books.location is '물리적 위치·대여처 등 (예: 집, 회사, 이모에게 빌려줌)';

-- 2) book_id 없는 행: books 행 생성 후 연결 (ISBN이 있으면 기존 books 우선)
do $$
declare
  r record;
  v_book_id uuid;
begin
  for r in
    select * from public.user_books where book_id is null
  loop
    if r.isbn is not null and length(trim(r.isbn)) > 0 then
      select b.id into v_book_id
      from public.books b
      where b.isbn = trim(r.isbn)
      limit 1;

      if v_book_id is not null then
        update public.user_books set book_id = v_book_id where id = r.id;
        continue;
      end if;
    end if;

    insert into public.books (
      isbn,
      title,
      authors,
      publisher,
      published_date,
      cover_url,
      description,
      price_krw,
      source
    )
    values (
      case when r.isbn is not null and length(trim(r.isbn)) > 0 then trim(r.isbn) else null end,
      r.title,
      r.authors,
      r.publisher,
      r.published_date,
      r.cover_url,
      r.description,
      r.price_krw,
      'legacy-user-book'
    )
    returning id into v_book_id;

    update public.user_books set book_id = v_book_id where id = r.id;
  end loop;
end $$;

alter table public.user_books alter column book_id set not null;

alter table public.user_books
  drop constraint if exists user_books_book_id_fkey;

alter table public.user_books
  add constraint user_books_book_id_fkey
  foreign key (book_id) references public.books (id) on delete restrict;

alter table public.user_books
  drop column if exists title,
  drop column if exists authors,
  drop column if exists isbn,
  drop column if exists cover_url,
  drop column if exists publisher,
  drop column if exists published_date,
  drop column if exists description,
  drop column if exists price_krw;

-- 목록: books 조인 + 검색은 서지 기준
drop function if exists public.list_user_books_paged(uuid, text, int, int, text, text, boolean);

create or replace function public.list_user_books_paged(
  p_user_id uuid,
  p_search text,
  p_limit int,
  p_offset int,
  p_format text default null,
  p_reading_status text default null,
  p_is_owned boolean default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
  v_items json;
  v_needle text := nullif(trim(coalesce(p_search, '')), '');
  lim int := greatest(1, least(coalesce(nullif(p_limit, 0), 20), 100));
  off int := greatest(0, coalesce(p_offset, 0));
begin
  select count(*)::bigint into v_total
  from public.user_books ub
  inner join public.books b on b.id = ub.book_id
  where ub.user_id = p_user_id
    and (p_format is null or p_format = '' or p_format = 'all' or ub.format = p_format)
    and (
      p_reading_status is null
      or p_reading_status = ''
      or p_reading_status = 'all'
      or ub.reading_status = p_reading_status
    )
    and (
      p_is_owned is null
      or ub.is_owned is not distinct from p_is_owned
    )
    and (
      v_needle is null
      or b.title ilike '%' || v_needle || '%'
      or exists (select 1 from unnest(b.authors) a where a ilike '%' || v_needle || '%')
    );

  select coalesce(
    (
      select json_agg(row_to_json(t))
      from (
        select
          ub.id,
          ub.user_id,
          ub.book_id,
          b.isbn,
          b.title,
          b.authors,
          ub.format,
          ub.reading_status,
          ub.rating,
          ub.memo,
          b.cover_url,
          b.publisher,
          b.published_date,
          b.description,
          b.price_krw,
          ub.is_owned,
          ub.location,
          ub.created_at,
          ub.updated_at
        from public.user_books ub
        inner join public.books b on b.id = ub.book_id
        where ub.user_id = p_user_id
          and (p_format is null or p_format = '' or p_format = 'all' or ub.format = p_format)
          and (
            p_reading_status is null
            or p_reading_status = ''
            or p_reading_status = 'all'
            or ub.reading_status = p_reading_status
          )
          and (
            p_is_owned is null
            or ub.is_owned is not distinct from p_is_owned
          )
          and (
            v_needle is null
            or b.title ilike '%' || v_needle || '%'
            or exists (select 1 from unnest(b.authors) a where a ilike '%' || v_needle || '%')
          )
        order by ub.updated_at desc
        limit lim
        offset off
      ) t
    ),
    '[]'::json
  ) into v_items;

  return json_build_object('items', v_items, 'total', v_total);
end;
$$;

revoke all on function public.list_user_books_paged(uuid, text, int, int, text, text, boolean) from public;
grant execute on function public.list_user_books_paged(uuid, text, int, int, text, text, boolean) to service_role;

-- 소장 가격 합계: books.price_krw 기준
create or replace function public.user_owned_books_price_stats(p_user_id uuid)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'totalKrw', coalesce(
      sum(b.price_krw) filter (
        where ub.is_owned = true and b.price_krw is not null
      ),
      0
    )::bigint,
    'pricedOwnedCount', (
      count(*) filter (
        where ub.is_owned = true and b.price_krw is not null
      )
    )::bigint,
    'ownedCount', (count(*) filter (where ub.is_owned = true))::bigint
  )
  from public.user_books ub
  inner join public.books b on b.id = ub.book_id
  where ub.user_id = p_user_id;
$$;

revoke all on function public.user_owned_books_price_stats(uuid) from public;
grant execute on function public.user_owned_books_price_stats(uuid) to service_role;
