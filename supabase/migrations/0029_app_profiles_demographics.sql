-- app_profiles: optional demographics + per-field public flags for future stats (aggregates use *_public only).
-- @history 2026-04-02: 신규 — 성별·생년월일 NULL 허용, 통계 동의 플래그

alter table public.app_profiles
  add column if not exists gender text null,
  add column if not exists birth_date date null,
  add column if not exists gender_public boolean not null default false,
  add column if not exists birth_date_public boolean not null default false;

comment on column public.app_profiles.gender is '선택 입력(예 male, female, other, unknown). 통계에는 gender_public=true일 때만 사용.';
comment on column public.app_profiles.birth_date is '선택 생년월일. 통계에는 birth_date_public=true일 때만 사용.';

alter table public.app_profiles
  drop constraint if exists app_profiles_gender_check;

alter table public.app_profiles
  add constraint app_profiles_gender_check
  check (gender is null or char_length(trim(gender)) <= 32);
