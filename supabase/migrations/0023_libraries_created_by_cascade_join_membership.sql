-- 회원 탈퇴: `app_users` 삭제 시 해당 사용자가 만든 공동서재(`libraries`)도 함께 삭제되도록 CASCADE.
-- (기존 RESTRICT이면 탈퇴 전 수동으로 서재를 지워야 했음.)

alter table public.libraries
  drop constraint if exists libraries_created_by_fkey;

alter table public.libraries
  add constraint libraries_created_by_fkey
  foreign key (created_by) references public.app_users(id) on delete cascade;

-- 가입 포인트 이벤트 코드 `join_membership` (앱에서 사용). 이미 있으면 유지.
insert into public.point_rules (rule_version_id, event_code, points, daily_cap_per_user, monthly_cap_per_user)
select v.id, 'join_membership', 100, null, null
from public.point_rule_versions v
where v.version = 1
on conflict (rule_version_id, event_code) do nothing;
