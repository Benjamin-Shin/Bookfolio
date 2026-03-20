-- 도서·내 서재 가격(원, 선택). ISBN 조회·수동 입력.
alter table public.books
  add column if not exists price_krw integer
  check (price_krw is null or price_krw >= 0);

alter table public.user_books
  add column if not exists price_krw integer
  check (price_krw is null or price_krw >= 0);

-- 소장(is_owned)이면서 가격이 있는 책만 합산 (대시보드용)
create or replace function public.user_owned_books_price_stats(p_user_id uuid)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'totalKrw', coalesce(
      sum(ub.price_krw) filter (
        where ub.is_owned = true and ub.price_krw is not null
      ),
      0
    )::bigint,
    'pricedOwnedCount', (
      count(*) filter (
        where ub.is_owned = true and ub.price_krw is not null
      )
    )::bigint,
    'ownedCount', (count(*) filter (where ub.is_owned = true))::bigint
  )
  from public.user_books ub
  where ub.user_id = p_user_id;
$$;

revoke all on function public.user_owned_books_price_stats(uuid) from public;
grant execute on function public.user_owned_books_price_stats(uuid) to service_role;
