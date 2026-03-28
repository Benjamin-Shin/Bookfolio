-- 0027: `user_book_register` 일괄 백필
-- 소장 도서 권수(user_books, is_owned) × 활성 정책의 `user_book_register` 점수만큼을
-- **사용자당 원장 1행**으로 반영한다. (정상 경로는 권당 1행·멱등 키 `user_book_register:{user_book_id}`.)
-- 같은 이유(`reason`)로 이미 적립된 합계가 있으면 차갛하여 이중 지급을 막는다.
-- 멱등: `idempotency_key = user_book_register:bulk_backfill_2026_03_28:{user_id}` — 재실행 시 23505 또는 delta=0으로 무동작.
--
-- @history
-- - 2026-03-28: 초기 작성

insert into public.user_points_ledger (
  user_id,
  delta,
  balance_after,
  reason,
  ref_type,
  ref_id,
  rule_version_id,
  idempotency_key
)
select
  c.user_id,
  c.delta,
  c.prev_balance + c.delta,
  'user_book_register',
  'bulk_migration',
  null,
  c.rule_version_id,
  'user_book_register:bulk_backfill_2026_03_28:' || c.user_id::text
from (
  select
    o.user_id,
    rr.rule_version_id,
    greatest(0, o.cnt * rr.points - coalesce(a.credited, 0)) as delta,
    coalesce(l.balance_after, 0) as prev_balance
  from (
    select ub.user_id, count(*)::int as cnt
    from public.user_books ub
    where ub.is_owned = true
    group by ub.user_id
  ) o
  inner join lateral (
    select pr.rule_version_id, pr.points
    from public.point_rules pr
    inner join public.point_rule_versions v on v.id = pr.rule_version_id
    where pr.event_code = 'user_book_register'
    order by v.version desc
    limit 1
  ) rr on true
  left join lateral (
    select coalesce(sum(spl.delta), 0)::int as credited
    from public.user_points_ledger spl
    where spl.user_id = o.user_id
      and spl.reason = 'user_book_register'
  ) a on true
  left join lateral (
    select l2.balance_after
    from public.user_points_ledger l2
    where l2.user_id = o.user_id
    order by l2.created_at desc, l2.id desc
    limit 1
  ) l on true
  where rr.points > 0
    and greatest(0, o.cnt * rr.points - coalesce(a.credited, 0)) > 0
) c;
