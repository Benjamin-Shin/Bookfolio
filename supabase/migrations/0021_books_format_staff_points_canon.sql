-- 0021: 서지 `books.format` (캐논), `user_books.format` 제거, `STAFF` 역할,
-- 포인트 정책·원장·캐논 수정 요청·투표·월간 순위 테이블(스캐폴드),
-- RPC `list_user_books_paged`가 `books.format` 기준으로 필터/반환하도록 수정.

-- A) books.format (캐논; ISBN당 공유)
alter table public.books
  add column if not exists format text;

update public.books b
set format = coalesce(s.fmt, 'paper')
from (
  select distinct on (ub.book_id)
    ub.book_id,
    case
      when ub.format in ('paper', 'ebook') then ub.format
      else 'unknown'
    end as fmt
  from public.user_books ub
  where ub.book_id is not null
  order by ub.book_id, ub.updated_at desc nulls last
) s
where b.id = s.book_id;

update public.books
set format = 'paper'
where format is null;

alter table public.books
  alter column format set not null,
  alter column format set default 'paper';

alter table public.books
  drop constraint if exists books_format_check;

alter table public.books
  add constraint books_format_check
  check (format in ('paper', 'ebook', 'audiobook', 'unknown'));

comment on column public.books.format is '종이/전자/오디오/미상; ISBN(캐논) 단위로 공유.';

-- B) user_books: 형식은 캐논으로 이전 후 컬럼·인덱스 제거
drop index if exists public.idx_user_books_format;

alter table public.user_books
  drop column if exists format;

-- C) app_users.role: STAFF
alter table public.app_users
  drop constraint if exists app_users_role_check;

alter table public.app_users
  add constraint app_users_role_check
  check (role in ('ADMIN', 'USER', 'STAFF'));

comment on column public.app_users.role is 'ADMIN: 관리 UI; STAFF: 감수·운영(예정); USER: 일반.';

-- D) 포인트 정책 버전·규칙·원장 (스텁; 실제 점수/한도는 이후 확정)
create table if not exists public.point_rule_versions (
  id uuid primary key default gen_random_uuid(),
  version int not null unique,
  effective_from timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.point_rules (
  id uuid primary key default gen_random_uuid(),
  rule_version_id uuid not null references public.point_rule_versions(id) on delete cascade,
  event_code text not null,
  points int not null check (points >= 0),
  daily_cap_per_user int,
  monthly_cap_per_user int,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (rule_version_id, event_code)
);

create table if not exists public.user_points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  delta int not null,
  balance_after int not null,
  reason text not null,
  ref_type text,
  ref_id uuid,
  rule_version_id uuid references public.point_rule_versions(id) on delete set null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_points_ledger_user_created
  on public.user_points_ledger(user_id, created_at desc);

-- E) 캐논 수정 요청·투표·월간 순위 (스캐폴드)
create table if not exists public.book_canon_edit_requests (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  submitted_by uuid not null references public.app_users(id) on delete cascade,
  proposed_patch jsonb not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  reviewer_user_id uuid references public.app_users(id) on delete set null,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_book_canon_edit_requests_status
  on public.book_canon_edit_requests(status);

drop trigger if exists set_book_canon_edit_requests_updated_at on public.book_canon_edit_requests;
create trigger set_book_canon_edit_requests_updated_at
  before update on public.book_canon_edit_requests
  for each row execute procedure public.set_updated_at();

create table if not exists public.monthly_contribution_rankings (
  id uuid primary key default gen_random_uuid(),
  period_month date not null,
  user_id uuid not null references public.app_users(id) on delete cascade,
  rank int not null,
  points_earned int not null,
  snapshot_at timestamptz not null default now(),
  unique (period_month, user_id)
);

create index if not exists idx_monthly_contribution_rankings_period
  on public.monthly_contribution_rankings(period_month, rank);

create table if not exists public.canon_vote_ballots (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.book_canon_edit_requests(id) on delete cascade,
  voter_user_id uuid not null references public.app_users(id) on delete cascade,
  vote int not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, voter_user_id)
);

drop trigger if exists set_canon_vote_ballots_updated_at on public.canon_vote_ballots;
create trigger set_canon_vote_ballots_updated_at
  before update on public.canon_vote_ballots
  for each row execute procedure public.set_updated_at();

create table if not exists public.canon_vote_tallies (
  request_id uuid primary key references public.book_canon_edit_requests(id) on delete cascade,
  up_count int not null default 0,
  down_count int not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_canon_vote_tallies_updated_at on public.canon_vote_tallies;
create trigger set_canon_vote_tallies_updated_at
  before update on public.canon_vote_tallies
  for each row execute procedure public.set_updated_at();

-- F) 정책 v1 시드 (포인트 0 — 제품 규칙 확정 후 조정)
insert into public.point_rule_versions (version, notes)
values (1, 'Initial stub rules; migration 0021')
on conflict (version) do nothing;

insert into public.point_rules (rule_version_id, event_code, points, daily_cap_per_user, monthly_cap_per_user)
select v.id, x.event_code, x.points, x.daily_cap, x.monthly_cap
from public.point_rule_versions v
cross join (values
  ('canon_edit_approved', 0, null::int, null::int),
  ('canon_vote_cast', 0, null::int, null::int),
  ('monthly_rank_reward', 0, null::int, null::int),
  ('canon_edit_rejected_penalty', 0, null::int, null::int)
) as x(event_code, points, daily_cap, monthly_cap)
where v.version = 1
on conflict (rule_version_id, event_code) do nothing;

-- G) list_user_books_paged: 필터·출력 `books.format`
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
