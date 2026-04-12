-- 비소장 상세용 구매 링크·가격 스냅샷 캐시(서버가 주기적으로 갱신).
-- RLS: 정책 없음 — API는 service_role로만 접근.

create table if not exists public.book_purchase_offer_cache (
  book_id uuid not null references public.books (id) on delete cascade,
  isbn text,
  title_hint text,
  aladin_url text,
  aladin_price_krw integer,
  naver_url text,
  naver_lowest_price_krw integer,
  kyobo_search_url text not null,
  raw_snapshot jsonb,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (book_id),
  constraint book_purchase_offer_cache_prices_nonneg check (
    (aladin_price_krw is null or aladin_price_krw >= 0)
    and (naver_lowest_price_krw is null or naver_lowest_price_krw >= 0)
  )
);

create index if not exists idx_book_purchase_offer_cache_expires
  on public.book_purchase_offer_cache (expires_at);

comment on table public.book_purchase_offer_cache is
  '캐논 도서별 알라딘·네이버·교보문고 구매 힌트 URL·가격 스냅샷(만료 후 API에서 재조회).';

alter table public.book_purchase_offer_cache enable row level security;
