-- user_books.memo 제거 → user_book_memos (마크다운 본문, 다건)
-- book_one_liners: 소장자 한줄평(책당 1개, 타인 조회 가능)
-- user_book_reading_events: 독서 이벤트 타임라인(본인만)
-- list_user_books_paged: memo 컬럼 제거
-- 리더보드·캘린더 집계 RPC

create table if not exists public.user_book_memos (
  id uuid primary key default gen_random_uuid(),
  user_book_id uuid not null references public.user_books (id) on delete cascade,
  body_md text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_book_memos_body_len check (char_length(body_md) <= 50000)
);

create index if not exists idx_user_book_memos_ub_updated
  on public.user_book_memos (user_book_id, updated_at desc);

drop trigger if exists set_user_book_memos_updated_at on public.user_book_memos;
create trigger set_user_book_memos_updated_at
  before update on public.user_book_memos
  for each row execute procedure public.set_updated_at ();

alter table public.user_book_memos enable row level security;

create table if not exists public.book_one_liners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_one_liners_user_book unique (user_id, book_id),
  constraint book_one_liners_body_len check (char_length(body) between 1 and 500)
);

create index if not exists idx_book_one_liners_book_id on public.book_one_liners (book_id);

drop trigger if exists set_book_one_liners_updated_at on public.book_one_liners;
create trigger set_book_one_liners_updated_at
  before update on public.book_one_liners
  for each row execute procedure public.set_updated_at ();

alter table public.book_one_liners enable row level security;

create table if not exists public.user_book_reading_events (
  id uuid primary key default gen_random_uuid(),
  user_book_id uuid not null references public.user_books (id) on delete cascade,
  event_type text not null check (
    event_type in ('read_start', 'progress', 'read_pause', 'read_complete', 'dropped')
  ),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_ub_reading_events_ub_time
  on public.user_book_reading_events (user_book_id, occurred_at desc);

create index if not exists idx_ub_reading_events_time
  on public.user_book_reading_events (occurred_at);

alter table public.user_book_reading_events enable row level security;

-- memo → memos (한 행으로 이관)
insert into public.user_book_memos (user_book_id, body_md, created_at, updated_at)
select ub.id, trim(ub.memo), ub.updated_at, ub.updated_at
from public.user_books ub
where ub.memo is not null
  and length(trim(ub.memo)) > 0;

alter table public.user_books drop column if exists memo;

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

-- 완독 권수 / 소장 권수 리더보드 (표시명은 app_profiles·app_users)
create or replace function public.reading_leaderboard(
  p_user_id uuid,
  p_kind text,
  p_top_n int
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_top json;
  v_me json;
  v_total_ranked int;
  lim int := greatest(1, least(coalesce(nullif(p_top_n, 0), 20), 100));
begin
  if p_kind is null or p_kind not in ('completed', 'owned') then
    raise exception 'reading_leaderboard: invalid p_kind';
  end if;

  with stats as (
    select
      ub.user_id,
      case
        when p_kind = 'completed' then count(*) filter (where ub.reading_status = 'completed')
        else count(*) filter (where ub.is_owned = true)
      end as cnt
    from public.user_books ub
    group by ub.user_id
  ),
  filtered as (
    select * from stats where cnt > 0
  ),
  with_names as (
    select
      f.user_id,
      f.cnt,
      coalesce(ap.display_name, au.name, split_part(au.email, '@', 1), '') as display_name
    from filtered f
    inner join public.app_users au on au.id = f.user_id
    left join public.app_profiles ap on ap.id = f.user_id
  ),
  ranked as (
    select
      user_id,
      display_name,
      cnt::int,
      rank() over (order by cnt desc, user_id asc) as rnk,
      count(*) over () as n_ranked
    from with_names
  ),
  top_rows as (
    select * from ranked
    order by rnk asc, user_id asc
    limit lim
  )
  select
    coalesce(
      (select json_agg(
        json_build_object(
          'userId', tr.user_id,
          'displayName', tr.display_name,
          'count', tr.cnt
        )
        order by tr.rnk, tr.user_id
      ) from top_rows tr),
      '[]'::json
    ),
    (select json_build_object(
      'rank', r.rnk,
      'count', r.cnt,
      'totalRankedUsers', r.n_ranked
    ) from ranked r where r.user_id = p_user_id limit 1),
    (select count(*)::int from ranked)
  into v_top, v_me, v_total_ranked;

  if v_me is null then
    v_me := json_build_object('rank', null, 'count', 0, 'totalRankedUsers', coalesce(v_total_ranked, 0));
  end if;

  return json_build_object('top', v_top, 'me', v_me);
end;
$$;

revoke all on function public.reading_leaderboard(uuid, text, int) from public;
grant execute on function public.reading_leaderboard(uuid, text, int) to service_role;

-- 독서 이벤트 일일 집계 (UTC 날짜 문자열 키)
create or replace function public.user_reading_events_calendar(
  p_user_id uuid,
  p_from date,
  p_to date
)
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(
    json_object_agg(day::text, c),
    '{}'::json
  )
  from (
    select
      (e.occurred_at at time zone 'utc')::date as day,
      count(*)::int as c
    from public.user_book_reading_events e
    inner join public.user_books ub on ub.id = e.user_book_id
    where ub.user_id = p_user_id
      and (e.occurred_at at time zone 'utc')::date >= p_from
      and (e.occurred_at at time zone 'utc')::date <= p_to
    group by 1
  ) sub;
$$;

revoke all on function public.user_reading_events_calendar(uuid, date, date) from public;
grant execute on function public.user_reading_events_calendar(uuid, date, date) to service_role;

comment on table public.user_book_memos is '개인 소장 한 권에 대한 마크다운 메모(다건).';
comment on table public.book_one_liners is '사용자×도서당 1개 공개 한줄평(소장 시 작성).';
comment on table public.user_book_reading_events is '개인 독서 이벤트(시작·진도·완독·하차 등).';
