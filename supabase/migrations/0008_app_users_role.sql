-- 앱 계정 권한: ADMIN / USER (기본 USER)
alter table public.app_users
  add column if not exists role text not null default 'USER';

alter table public.app_users
  drop constraint if exists app_users_role_check;

alter table public.app_users
  add constraint app_users_role_check check (role in ('ADMIN', 'USER'));

comment on column public.app_users.role is 'ADMIN: 관리 화면 접근, USER: 일반';

create index if not exists idx_app_users_role on public.app_users (role);
