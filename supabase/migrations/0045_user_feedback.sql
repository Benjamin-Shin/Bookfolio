-- 사용자 의견·제안·버그 제보. RLS 켜고 정책 없음 — API가 service_role로만 접근.

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references public.app_users (id) on delete set null,
  platform text not null default 'unknown' check (platform in ('web', 'mobile', 'unknown')),
  category text not null default 'other' check (category in ('bug', 'idea', 'other')),
  body text not null,
  contact_email text,
  app_version text,
  device_info jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  admin_note text
);

create index if not exists idx_user_feedback_created_at on public.user_feedback (created_at desc);
create index if not exists idx_user_feedback_user_id on public.user_feedback (user_id);
create index if not exists idx_user_feedback_status on public.user_feedback (status);

comment on table public.user_feedback is '회원·앱 의견 제보(버그·제안 등). 스토어 리뷰와 별도.';

create or replace function public.set_user_feedback_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_feedback_updated_at on public.user_feedback;
create trigger trg_user_feedback_updated_at
  before update on public.user_feedback
  for each row
  execute function public.set_user_feedback_updated_at();

alter table public.user_feedback enable row level security;
