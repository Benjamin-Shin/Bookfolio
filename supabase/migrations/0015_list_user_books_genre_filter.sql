-- list_user_books_paged: 장르 슬러그 필터 + 목록에 genre_slugs 포함
-- list_user_owned_genre_slugs: 소장 도서에 등장하는 장르 슬러그 목록(정렬·중복 제거)

drop function if exists public.list_user_books_paged(uuid, text, int, int, text, text, boolean);

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
          ub.format,
          ub.reading_status,
          ub.rating,
          ub.memo,
          b.cover_url,
          b.publisher,
          b.published_date,
          b.description,
          b.price_krw,
          b.genre_slugs,
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

create or replace function public.list_user_owned_genre_slugs(p_user_id uuid)
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select json_agg(sub.slug order by sub.slug)
      from (
        select distinct trim(x.g) as slug
        from public.user_books ub
        inner join public.books b on b.id = ub.book_id
        cross join lateral unnest(b.genre_slugs) as x(g)
        where ub.user_id = p_user_id
          and ub.is_owned = true
      ) sub
      where sub.slug is not null
        and sub.slug <> ''
    ),
    '[]'::json
  );
$$;

revoke all on function public.list_user_owned_genre_slugs(uuid) from public;
grant execute on function public.list_user_owned_genre_slugs(uuid) to service_role;
