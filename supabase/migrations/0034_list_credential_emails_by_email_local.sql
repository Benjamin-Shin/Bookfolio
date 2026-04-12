-- 비밀번호 로그인: 이메일 @ 앞 로컬 부분만으로 계정 이메일을 해석할 때 사용 (서비스 롤 전용).
-- 동일 로컬·비밀번호 계정이 둘 이상이면 빈 배열에 가깝게 처리해 앱에서 거부한다.

create or replace function public.list_credential_emails_by_email_local(p_local text)
returns text[]
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    array_agg(u.email order by u.email),
    '{}'::text[]
  )
  from app_users u
  where lower(split_part(u.email, '@', 1)) = lower(trim(p_local))
    and u.password_hash is not null;
$$;

revoke all on function public.list_credential_emails_by_email_local(text) from public;
grant execute on function public.list_credential_emails_by_email_local(text) to service_role;
