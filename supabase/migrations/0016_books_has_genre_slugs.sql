-- Admin·목록 정렬: `genre_slugs`가 비어 있으면 false → "장르 없음" 행을 먼저 정렬할 때 사용
alter table public.books
  add column if not exists has_genre_slugs boolean
  generated always as (cardinality(genre_slugs) > 0) stored;

comment on column public.books.has_genre_slugs is
  'true when genre_slugs has at least one element; used for admin list ordering/filtering';

create index if not exists idx_books_has_genre_updated
  on public.books (has_genre_slugs asc, updated_at desc);
