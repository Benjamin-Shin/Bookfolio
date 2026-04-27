-- 동일 이메일로 중복 생성된 app_users 계정을 병합합니다.
-- 대상: Postgres(Supabase)
--
-- 사용 방법
-- 1) 아래 survivor_user_id / duplicate_user_id / target_email 값을 채웁니다.
-- 2) "Dry-run" SELECT로 영향 범위를 먼저 확인합니다.
-- 3) 트랜잭션 블록을 실행합니다.
-- 4) "Post-check" SELECT로 결과를 검증합니다.
--
-- 주의
-- - 운영 DB에서는 반드시 백업/스냅샷 후 실행하세요.
-- - 중복 계정을 hard delete 하지 않고 archived 상태로 남깁니다.

-- =========================================================
-- 0) 입력값
-- =========================================================
-- 예시:
--   survivor_user_id  = '11111111-1111-1111-1111-111111111111'
--   duplicate_user_id = '22222222-2222-2222-2222-222222222222'
--   target_email      = 'user@example.com'
with params as (
  select
    '11111111-1111-1111-1111-111111111111'::uuid as survivor_user_id,
    '22222222-2222-2222-2222-222222222222'::uuid as duplicate_user_id,
    'user@example.com'::text as target_email
)
select * from params;

-- =========================================================
-- 1) Dry-run: 대상 행 확인
-- =========================================================
with params as (
  select
    '11111111-1111-1111-1111-111111111111'::uuid as survivor_user_id,
    '22222222-2222-2222-2222-222222222222'::uuid as duplicate_user_id,
    lower('user@example.com')::text as target_email
)
select id, email, name, created_at
from public.app_users
where id in (
  (select survivor_user_id from params),
  (select duplicate_user_id from params)
)
order by created_at;

-- 이메일 중복 현황(참고)
with params as (
  select lower('user@example.com')::text as target_email
)
select id, email, name, created_at
from public.app_users
where lower(email) = (select target_email from params)
order by created_at;

-- =========================================================
-- 2) 병합 실행
-- =========================================================
begin;

do $$
declare
  v_survivor uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  v_duplicate uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  r record;
begin
  if v_survivor = v_duplicate then
    raise exception 'survivor_user_id and duplicate_user_id must be different';
  end if;

  if not exists (select 1 from public.app_users where id = v_survivor) then
    raise exception 'survivor_user_id not found: %', v_survivor;
  end if;

  if not exists (select 1 from public.app_users where id = v_duplicate) then
    raise exception 'duplicate_user_id not found: %', v_duplicate;
  end if;

  -- app_users를 참조하는 모든 FK를 탐색해서 duplicate -> survivor 로 갱신
  for r in
    select
      n.nspname as schema_name,
      c.relname as table_name,
      a.attname as column_name
    from pg_constraint co
    join pg_class c on c.oid = co.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join unnest(co.conkey) with ordinality as u(attnum, ord) on true
    join pg_attribute a on a.attrelid = co.conrelid and a.attnum = u.attnum
    where co.contype = 'f'
      and co.confrelid = 'public.app_users'::regclass
      and n.nspname = 'public'
  loop
    execute format(
      'update %I.%I set %I = $1 where %I = $2',
      r.schema_name, r.table_name, r.column_name, r.column_name
    )
    using v_survivor, v_duplicate;
  end loop;

  -- survivor의 핵심 속성 보강(비어있을 때만)
  update public.app_users s
  set
    name = coalesce(s.name, d.name),
    image = coalesce(s.image, d.image),
    email_verified = coalesce(s.email_verified, d.email_verified),
    updated_at = now()
  from public.app_users d
  where s.id = v_survivor
    and d.id = v_duplicate;

  -- duplicate는 논리 보관(이메일 충돌 방지용 suffix 부여)
  update public.app_users
  set
    email = email || '.merged+' || replace(v_duplicate::text, '-', ''),
    name = coalesce(name, '[merged-duplicate]'),
    updated_at = now()
  where id = v_duplicate;
end $$;

commit;

-- =========================================================
-- 3) Post-check: 검증
-- =========================================================
-- duplicate를 참조하는 FK가 남아 있으면 0이 아니어야 합니다.
do $$
declare
  v_duplicate uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  r record;
  cnt bigint;
begin
  for r in
    select
      n.nspname as schema_name,
      c.relname as table_name,
      a.attname as column_name
    from pg_constraint co
    join pg_class c on c.oid = co.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join unnest(co.conkey) with ordinality as u(attnum, ord) on true
    join pg_attribute a on a.attrelid = co.conrelid and a.attnum = u.attnum
    where co.contype = 'f'
      and co.confrelid = 'public.app_users'::regclass
      and n.nspname = 'public'
  loop
    execute format(
      'select count(*) from %I.%I where %I = $1',
      r.schema_name, r.table_name, r.column_name
    )
    into cnt
    using v_duplicate;

    if cnt > 0 then
      raise notice 'remaining refs: %.%(%): %',
        r.schema_name, r.table_name, r.column_name, cnt;
    end if;
  end loop;
end $$;
