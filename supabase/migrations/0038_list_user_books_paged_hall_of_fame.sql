-- list_user_books_paged: Hall of Fame 필터 (완독 + 개인 평점 4점 이상)
drop function if exists public.list_user_books_paged(uuid, text, int, int, text, text, boolean, text, text);

create or replace function public.list_user_books_paged(
  p_user_id uuid,
  p_search text,
  p_limit int,
  p_offset int,
  p_format text default null,
  p_reading_status text default null,
  p_is_owned boolean default null,
  p_genre_slug text default null,
  p_sort text default null,
  p_hall_of_fame boolean default false
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
  v_sort text := lower(nullif(trim(coalesce(p_sort, '')), ''));
  lim int := greatest(1, least(coalesce(nullif(p_limit, 0), 20), 100));
  off int := greatest(0, coalesce(p_offset, 0));
  v_hall boolean := coalesce(p_hall_of_fame, false);
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
    )
    and (
      not v_hall
      or (
        ub.reading_status = 'completed'
        and ub.rating is not null
        and ub.rating >= 4
      )
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
          and (
            not v_hall
            or (
              ub.reading_status = 'completed'
              and ub.rating is not null
              and ub.rating >= 4
            )
          )
        order by
          case when v_sort = 'title' then lower(b.title) end asc nulls last,
          ub.updated_at desc
        limit lim
        offset off
      ) t
    ),
    '[]'::json
  ) into v_items;

  return json_build_object('items', v_items, 'total', v_total);
end;
$$;

revoke all on function public.list_user_books_paged(uuid, text, int, int, text, text, boolean, text, text, boolean) from public;
grant execute on function public.list_user_books_paged(uuid, text, int, int, text, text, boolean, text, text, boolean) to service_role;
