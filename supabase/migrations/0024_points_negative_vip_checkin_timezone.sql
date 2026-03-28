-- 포인트 규칙 음수(차감) 허용, VIP·플랜, 일일 출석, 프로필 타임존, 사용자 잔액 뷰
--
-- point_rules: applications treat points=0 as no-op; positive=earn, negative=spend.

alter table public.point_rules drop constraint if exists point_rules_points_check;

-- B) 구독 플랜 마스터
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null unique,
  caps_json jsonb not null default '{}'::jsonb,
  display_name text,
  created_at timestamptz not null default now()
);

comment on table public.subscription_plans is 'VIP 등 플랜 마스터; caps_json은 운영 상한·기능 플래그(JSON).';

insert into public.subscription_plans (plan_key, caps_json, display_name)
values (
  'vip_standard',
  '{"points_spend_exempt": true, "caps": {"shared_libraries_owned_max": 30, "shared_library_members_total_max": 80, "shared_library_invites_per_library_per_month": 60, "isbn_metadata_lookup_per_day": 400, "barcode_scan_session_per_day": 200, "export_user_library_per_day": 10}, "features": {"premium_themes_unlocked": true, "can_create_extra_shared_libraries_without_points": true}}'::jsonb,
  'VIP Standard'
)
on conflict (plan_key) do nothing;

-- C) 사용자 구독 (MVP: 관리자 수동 부여)
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  plan_key text not null references public.subscription_plans (plan_key),
  status text not null default 'active' check (status in ('active', 'canceled', 'expired')),
  current_period_end timestamptz not null,
  caps_snapshot_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_user_subscriptions_updated_at on public.user_subscriptions;
create trigger set_user_subscriptions_updated_at
  before update on public.user_subscriptions
  for each row execute procedure public.set_updated_at();

create index if not exists idx_user_subscriptions_user_status_end
  on public.user_subscriptions (user_id, status, current_period_end desc);

comment on table public.user_subscriptions is '구독/VIP 기간; status=active 이고 current_period_end > now() 이면 유효.';

alter table public.user_subscriptions enable row level security;

-- D) 일일 출석(로컬 달력 일자 — 앱이 계산해 저장)
create table if not exists public.user_daily_check_ins (
  user_id uuid not null references public.app_users (id) on delete cascade,
  check_date date not null,
  first_activity_at timestamptz not null default now(),
  primary key (user_id, check_date)
);

create index if not exists idx_user_daily_check_ins_user_date on public.user_daily_check_ins (user_id, check_date desc);

comment on table public.user_daily_check_ins is '자격 행위(독서기록·소장등록 등) 시 사용자 로컬 기준 하루 1행; first_activity_at은 UTC.';

alter table public.user_daily_check_ins enable row level security;

-- E) 프로필 IANA 타임존 (출석 일자 계산용)
alter table public.app_profiles
  add column if not exists iana_timezone text;

comment on column public.app_profiles.iana_timezone is 'IANA TZ (예 Asia/Seoul); 없으면 서버는 UTC 달력 폴백 가능.';

-- F) 포인트 잔액 뷰 (관리자 목록·API용)
create or replace view public.v_user_points_balance as
select
  u.id as user_id,
  coalesce(
    (
      select l.balance_after
      from public.user_points_ledger l
      where l.user_id = u.id
      order by l.created_at desc
      limit 1
    ),
    0
  ) as points_balance
from public.app_users u;

comment on view public.v_user_points_balance is 'app_users별 최신 user_points_ledger.balance_after; 없으면 0.';
