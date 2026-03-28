-- 북폴리오 집계: 포인트 잔액 순위, 다중 소장 도서(권수) TOP

-- 회원별 포인트 잔액 리더보드 (`v_user_points_balance`; 잔액 > 0만 순위)
create or replace function public.points_leaderboard(
  p_user_id uuid,
  p_top_n int
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_top json;
  v_me json;
  v_total_ranked int;
  lim int := greatest(1, least(coalesce(nullif(p_top_n, 0), 20), 100));
begin
  with balances as (
    select
      v.user_id,
      v.points_balance::int as cnt
    from public.v_user_points_balance v
  ),
  filtered as (
    select * from balances where cnt > 0
  ),
  with_names as (
    select
      f.user_id,
      f.cnt,
      coalesce(ap.display_name, au.name, split_part(au.email, '@', 1), '') as display_name
    from filtered f
    inner join public.app_users au on au.id = f.user_id
    left join public.app_profiles ap on ap.id = f.user_id
  ),
  ranked as (
    select
      user_id,
      display_name,
      cnt,
      rank() over (order by cnt desc, user_id asc) as rnk,
      count(*) over () as n_ranked
    from with_names
  ),
  top_rows as (
    select * from ranked
    order by rnk asc, user_id asc
    limit lim
  )
  select
    coalesce(
      (select json_agg(
        json_build_object(
          'userId', tr.user_id,
          'displayName', tr.display_name,
          'count', tr.cnt
        )
        order by tr.rnk, tr.user_id
      ) from top_rows tr),
      '[]'::json
    ),
    (select json_build_object(
      'rank', r.rnk,
      'count', r.cnt,
      'totalRankedUsers', r.n_ranked
    ) from ranked r where r.user_id = p_user_id limit 1),
    (select count(*)::int from ranked)
  into v_top, v_me, v_total_ranked;

  if v_me is null then
    v_me := json_build_object(
      'rank', null,
      'count',
      coalesce(
        (select points_balance::int from public.v_user_points_balance where user_id = p_user_id),
        0
      ),
      'totalRankedUsers', coalesce(v_total_ranked, 0)
    );
  end if;

  return json_build_object('top', v_top, 'me', v_me);
end;
$$;

revoke all on function public.points_leaderboard(uuid, int) from public;
grant execute on function public.points_leaderboard(uuid, int) to service_role;

-- 소장(`is_owned`) 기준 동일 도서를 여러 회원이 등록한 횟수 TOP
create or replace function public.owned_book_popularity_leaderboard(
  p_top_n int
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_top json;
  lim int := greatest(1, least(coalesce(nullif(p_top_n, 0), 20), 100));
begin
  with counts as (
    select
      ub.book_id,
      count(*)::int as owner_count
    from public.user_books ub
    where ub.is_owned is true
    group by ub.book_id
  ),
  ranked as (
    select
      c.book_id,
      c.owner_count,
      b.title,
      b.cover_url,
      rank() over (order by c.owner_count desc, c.book_id asc) as rnk
    from counts c
    inner join public.books b on b.id = c.book_id
  ),
  top_rows as (
    select * from ranked
    order by rnk asc, book_id asc
    limit lim
  )
  select coalesce(
    (select json_agg(
      json_build_object(
        'bookId', tr.book_id,
        'title', tr.title,
        'coverUrl', tr.cover_url,
        'ownerCount', tr.owner_count
      )
      order by tr.rnk, tr.book_id
    ) from top_rows tr),
    '[]'::json
  ) into v_top;

  return json_build_object('top', v_top);
end;
$$;

revoke all on function public.owned_book_popularity_leaderboard(int) from public;
grant execute on function public.owned_book_popularity_leaderboard(int) to service_role;
