-- 클라이언트(웹·모바일) 오류 수집. RLS 켜고 정책 없음 — INSERT/SELECT는 API가 service_role로만 수행.

create table if not exists public.client_error_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references public.app_users (id) on delete set null,
  platform text not null default 'unknown' check (platform in ('web', 'mobile', 'unknown')),
  kind text not null default 'client',
  message text not null,
  context jsonb not null default '{}'::jsonb
);

create index if not exists idx_client_error_reports_created_at on public.client_error_reports (created_at desc);
create index if not exists idx_client_error_reports_user_id on public.client_error_reports (user_id);

comment on table public.client_error_reports is '클라이언트 오류 요약·비식별 context. PII는 API에서 마스킹 후 저장.';

alter table public.client_error_reports enable row level security;
