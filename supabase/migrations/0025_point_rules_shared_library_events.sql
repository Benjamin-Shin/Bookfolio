-- 공동서재 추가 생성·초대 초과 시 차감 이벤트(활성 정책 버전에만 부착)
insert into public.point_rules (rule_version_id, event_code, points, daily_cap_per_user, monthly_cap_per_user, metadata)
select v.id, 'shared_library_create_extra', -100, null, null, '{}'::jsonb
from public.point_rule_versions v
where v.version = (select max(version) from public.point_rule_versions)
on conflict (rule_version_id, event_code) do nothing;

insert into public.point_rules (rule_version_id, event_code, points, daily_cap_per_user, monthly_cap_per_user, metadata)
select v.id, 'shared_library_invite_extra', -50, null, null, '{}'::jsonb
from public.point_rule_versions v
where v.version = (select max(version) from public.point_rule_versions)
on conflict (rule_version_id, event_code) do nothing;
