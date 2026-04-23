-- 가입·첫 서가 등록 등용 이벤트 코드 행 (정책 v1). 점수는 관리 화면에서 조정 가능.
insert into public.point_rules (rule_version_id, event_code, points, daily_cap_per_user, monthly_cap_per_user)
select v.id, 'join_membership', 100, null, null
from public.point_rule_versions v
where v.version = 1
on conflict (rule_version_id, event_code) do nothing;

insert into public.point_rules (rule_version_id, event_code, points, daily_cap_per_user, monthly_cap_per_user)
select v.id, 'user_book_register', 10, 30, null
from public.point_rule_versions v
where v.version = 1
on conflict (rule_version_id, event_code) do nothing;
