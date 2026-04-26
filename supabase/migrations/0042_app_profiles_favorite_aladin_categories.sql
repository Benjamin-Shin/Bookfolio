-- 사용자별 알라딘 관심 카테고리(CID) 저장: 최대 5개
alter table public.app_profiles
  add column if not exists favorite_aladin_category_ids integer[] not null default '{}'::integer[];

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'app_profiles_favorite_aladin_category_ids_max5'
      and conrelid = 'public.app_profiles'::regclass
  ) then
    alter table public.app_profiles
      add constraint app_profiles_favorite_aladin_category_ids_max5
      check (coalesce(array_length(favorite_aladin_category_ids, 1), 0) <= 5);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'app_profiles_favorite_aladin_category_ids_positive'
      and conrelid = 'public.app_profiles'::regclass
  ) then
    alter table public.app_profiles
      add constraint app_profiles_favorite_aladin_category_ids_positive
      check (
        array_position(favorite_aladin_category_ids, null) is null
        and 0 < all (favorite_aladin_category_ids)
      );
  end if;
end $$;
