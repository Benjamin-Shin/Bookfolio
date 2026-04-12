-- 온보딩 완료 시각(회원가입 후 1회 가이드). null이면 미완료.

alter table public.app_profiles
  add column if not exists onboarding_completed_at timestamptz null;

comment on column public.app_profiles.onboarding_completed_at is
  '앱 온보딩(카메라·바코드 안내 등) 완료 시각. null이면 미완료.';

-- 기존 회원은 이미 앱을 쓰고 있던 것으로 간주해 백필(신규 가입만 null 유지).
update public.app_profiles
set onboarding_completed_at = coalesce(onboarding_completed_at, created_at)
where onboarding_completed_at is null;
