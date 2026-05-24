-- user_books: 개인 서가 정리용 태그(책당 최대 5). 장르(books.genre_slugs)와 별도.

alter table public.user_books
  add column if not exists tags text[] not null default '{}';

alter table public.user_books
  drop constraint if exists user_books_tags_max_five;

alter table public.user_books
  add constraint user_books_tags_max_five
  check (cardinality(tags) <= 5);

comment on column public.user_books.tags is '사용자 개인 태그(책당 최대 5). 내 서가 필터·정리용';

create index if not exists idx_user_books_tags on public.user_books using gin (tags);

-- list_user_books_paged: tags 컬럼 반환 + p_tag 필터
drop function if exists public.list_user_books_paged(uuid, text, int, int, text, text, boolean, text, text, boolean);

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
  p_hall_of_fame boolean default false,
  p_tag text default null
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
  v_tag text := nullif(trim(coalesce(p_tag, '')), '');
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
      v_tag is null
      or (
        v_tag = '__untagged__'
        and cardinality(coalesce(ub.tags, '{}')) = 0
      )
      or (
        v_tag <> '__untagged__'
        and v_tag = any(coalesce(ub.tags, '{}'))
      )
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
          ub.tags,
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
            v_tag is null
            or (
              v_tag = '__untagged__'
              and cardinality(coalesce(ub.tags, '{}')) = 0
            )
            or (
              v_tag <> '__untagged__'
              and v_tag = any(coalesce(ub.tags, '{}'))
            )
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

revoke all on function public.list_user_books_paged(uuid, text, int, int, text, text, boolean, text, text, boolean, text) from public;
grant execute on function public.list_user_books_paged(uuid, text, int, int, text, text, boolean, text, text, boolean, text) to service_role;

create or replace function public.list_user_book_tags(p_user_id uuid)
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select json_agg(tag order by tag)
      from (
        select distinct trim(t) as tag
        from public.user_books ub,
          unnest(coalesce(ub.tags, '{}')) as t
        where ub.user_id = p_user_id
          and trim(t) <> ''
      ) s
    ),
    '[]'::json
  );
$$;

revoke all on function public.list_user_book_tags(uuid) from public;
grant execute on function public.list_user_book_tags(uuid) to service_role;
