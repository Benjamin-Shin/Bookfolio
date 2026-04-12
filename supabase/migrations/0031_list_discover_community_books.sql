-- 발견 탭: 내가 아직 소장하지 않은 책 중 다른 회원이 등록한 종이책 캐논 목록

create or replace function public.list_discover_community_books(
  p_user_id uuid,
  p_limit int default 30
)
returns table (
  book_id uuid,
  isbn text,
  title text,
  authors text[],
  cover_url text,
  publisher text,
  published_date text,
  description text,
  price_krw integer,
  format text,
  other_owner_count integer,
  last_added_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id as book_id,
    b.isbn,
    b.title,
    b.authors,
    b.cover_url,
    b.publisher,
    b.published_date,
    b.description,
    b.price_krw,
    coalesce(b.format, 'paper'::text) as format,
    agg.other_owner_count,
    agg.last_added_at
  from public.books b
  inner join (
    select
      ub.book_id as bid,
      max(ub.created_at) as last_added_at,
      count(distinct ub.user_id)::integer as other_owner_count
    from public.user_books ub
    where ub.user_id <> p_user_id
    group by ub.book_id
  ) agg on agg.bid = b.id
  where not exists (
    select 1
    from public.user_books mine
    where mine.book_id = b.id
      and mine.user_id = p_user_id
  )
  and coalesce(b.format, 'paper') = 'paper'
  order by agg.last_added_at desc
  limit greatest(1, least(coalesce(p_limit, 30), 50));
$$;

comment on function public.list_discover_community_books(uuid, int) is
  '로그인 사용자 기준: 본인 미소장·타인 user_books 존재·캐논 format=paper. 발견 탭용.';

revoke all on function public.list_discover_community_books(uuid, int) from public;
grant execute on function public.list_discover_community_books(uuid, int) to service_role;
