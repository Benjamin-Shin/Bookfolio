-- 프로필: app_users와 1:1 (NextAuth 계정 표시명·아바타)
create table if not exists public.app_profiles (
  id uuid primary key references public.app_users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_app_profiles_updated_at on public.app_profiles;
create trigger set_app_profiles_updated_at
  before update on public.app_profiles
  for each row execute procedure public.set_updated_at();

alter table public.app_profiles enable row level security;

-- 기존 app_users.name / image → 프로필로 이관
insert into public.app_profiles (id, display_name, avatar_url)
select id, name, image
from public.app_users
on conflict (id) do nothing;

-- 서비스 레이어(service_role)만 호출. user_id는 API에서 세션 기준으로 전달.
create or replace function public.list_user_books_paged(
  p_user_id uuid,
  p_search text,
  p_limit int,
  p_offset int,
  p_format text default null,
  p_reading_status text default null
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

revoke all on function public.list_user_books_paged(uuid, text, int, int, text, text) from public;
grant execute on function public.list_user_books_paged(uuid, text, int, int, text, text) to service_role;
