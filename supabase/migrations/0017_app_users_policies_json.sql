-- 사용자별 정책(확장용 JSON). 앱에서 키를 점진적으로 추가합니다.

alter table public.app_users
  add column if not exists policies_json jsonb not null default '{"sharedLibraryCreateLimit":1}'::jsonb;

comment on column public.app_users.policies_json is
  '사용자별 정책 JSON. 예: sharedLibraryCreateLimit(내가 소유자로 새로 만들 수 있는 공동서가 최대 개수, 기본 1)';
