create table if not exists public.mobile_login_transfer_codes (
  code text primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_mobile_login_transfer_codes_user_id
  on public.mobile_login_transfer_codes(user_id);

create index if not exists idx_mobile_login_transfer_codes_expires_at
  on public.mobile_login_transfer_codes(expires_at);

alter table public.mobile_login_transfer_codes enable row level security;

comment on table public.mobile_login_transfer_codes is '모바일 로그인 세션을 웹 NextAuth 세션으로 넘기기 위한 1회용 코드';
comment on column public.mobile_login_transfer_codes.code is 'base64url 1회용 코드';
comment on column public.mobile_login_transfer_codes.expires_at is '코드 만료 시각(기본 60초 이내)';
comment on column public.mobile_login_transfer_codes.used_at is '코드 사용 시각(재사용 방지)';
