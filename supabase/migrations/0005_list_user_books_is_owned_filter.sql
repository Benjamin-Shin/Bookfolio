-- list_user_books_paged: 소장 여부 필터 (대시보드 이중 책장용)
drop function if exists public.list_user_books_paged(uuid, text, int, int, text, text);

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
      or ub.title ilike '%' || v_needle || '%'
      or exists (select 1 from unnest(ub.authors) a where a ilike '%' || v_needle || '%')
    );

  select coalesce(
    (
      select json_agg(row_to_json(t))
      from (
        select *
        from public.user_books ub
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
            or ub.title ilike '%' || v_needle || '%'
            or exists (select 1 from unnest(ub.authors) a where a ilike '%' || v_needle || '%')
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
