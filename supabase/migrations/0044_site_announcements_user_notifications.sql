-- 전역 공지(`site_announcements`) 및 사용자별 개인 알림(`user_notifications`).
-- RLS 활성화·정책 없음 — 웹 API가 service_role로 접근(기존 `client_error_reports` 패턴).

create table if not exists public.site_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  sort_order integer not null default 0,
  created_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_announcements_expires_after_publish
    check (
      expires_at is null
      or published_at is null
      or expires_at >= published_at
    )
);

create index if not exists idx_site_announcements_published_sort
  on public.site_announcements (is_published, sort_order, published_at desc);

create index if not exists idx_site_announcements_updated_at
  on public.site_announcements (updated_at desc);

drop trigger if exists set_site_announcements_updated_at on public.site_announcements;
create trigger set_site_announcements_updated_at
  before update on public.site_announcements
  for each row execute procedure public.set_updated_at();

comment on table public.site_announcements is '전역 공지(헤더·공지 목록). 게시 중만 사용자에게 노출.';
comment on column public.site_announcements.published_at is '게시 시작 시각(NULL이면 미게시 또는 초안).';
comment on column public.site_announcements.expires_at is '게시 종료 시각(NULL이면 만료 없음).';

alter table public.site_announcements enable row level security;


create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'info'
    check (kind in ('info', 'success', 'warning', 'system')),
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_notifications_user_created
  on public.user_notifications (user_id, created_at desc);

create index if not exists idx_user_notifications_user_unread
  on public.user_notifications (user_id)
  where read_at is null;

comment on table public.user_notifications is '사용자별 개인 알림(읽음 여부·종류).';
comment on column public.user_notifications.kind is 'info|success|warning|system';

alter table public.user_notifications enable row level security;
