-- 개인 독서 진행(쪽) + 프로필 연간 완독 목표(권)

alter table public.user_books
  add column if not exists current_page integer,
  add column if not exists reading_total_pages integer;

comment on column public.user_books.current_page is '읽는 중 진행 — 현재까지 읽은 쪽(1-based 권장). NULL이면 미입력.';
comment on column public.user_books.reading_total_pages is '이 권의 총 쪽 수 사용자 재정의. NULL이면 books.page_count 사용.';

alter table public.user_books
  drop constraint if exists user_books_current_page_check;
alter table public.user_books
  add constraint user_books_current_page_check
  check (current_page is null or (current_page >= 0 and current_page <= 50000));

alter table public.user_books
  drop constraint if exists user_books_reading_total_pages_check;
alter table public.user_books
  add constraint user_books_reading_total_pages_check
  check (reading_total_pages is null or (reading_total_pages >= 1 and reading_total_pages <= 50000));

alter table public.user_books
  drop constraint if exists user_books_reading_pages_order_check;
alter table public.user_books
  add constraint user_books_reading_pages_order_check
  check (
    current_page is null
    or reading_total_pages is null
    or current_page <= reading_total_pages
  );

alter table public.app_profiles
  add column if not exists annual_reading_goal integer;

comment on column public.app_profiles.annual_reading_goal is '올해 완독 목표 권수. NULL이면 목표 미설정.';

alter table public.app_profiles
  drop constraint if exists app_profiles_annual_reading_goal_check;
alter table public.app_profiles
  add constraint app_profiles_annual_reading_goal_check
  check (annual_reading_goal is null or (annual_reading_goal >= 1 and annual_reading_goal <= 500));

-- list_user_books_paged: 진행 쪽 + 서지 쪽수
drop function if exists public.list_user_books_paged(uuid, text, int, int, text, text, boolean, text);

create or replace function public.list_user_books_paged(
  p_user_id uuid,
  p_search text,
  p_limit int,
  p_offset int,
  p_format text default null,
  p_reading_status text default null,
  p_is_owned boolean default null,
  p_genre_slug text default null
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
  v_genre text := nullif(trim(coalesce(p_genre_slug, '')), '');
  lim int := greatest(1, least(coalesce(nullif(p_limit, 0), 20), 100));
  off int := greatest(0, coalesce(p_offset, 0));
begin
  select count(*)::bigint into v_total
  from public.user_books ub
  inner join public.books b on b.id = ub.book_id
  where ub.user_id = p_user_id
    and (p_format is null or p_format = '' or p_format = 'all' or b.format = p_format)
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
      v_genre is null
      or v_genre = any(b.genre_slugs)
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
          b.format,
          ub.reading_status,
          ub.rating,
          b.cover_url,
          b.publisher,
          b.published_date,
          b.description,
          b.price_krw,
          b.genre_slugs,
          b.page_count as book_page_count,
          ub.current_page,
          ub.reading_total_pages,
          ub.is_owned,
          ub.location,
          ub.created_at,
          ub.updated_at
        from public.user_books ub
        inner join public.books b on b.id = ub.book_id
        where ub.user_id = p_user_id
          and (p_format is null or p_format = '' or p_format = 'all' or b.format = p_format)
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
            v_genre is null
            or v_genre = any(b.genre_slugs)
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

revoke all on function public.list_user_books_paged(uuid, text, int, int, text, text, boolean, text) from public;
grant execute on function public.list_user_books_paged(uuid, text, int, int, text, text, boolean, text) to service_role;
