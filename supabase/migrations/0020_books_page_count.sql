-- 공유 서지 총 페이지(쪽). NULL = 미입력.
alter table public.books
  add column if not exists page_count integer;

alter table public.books
  drop constraint if exists books_page_count_positive;

alter table public.books
  add constraint books_page_count_positive
  check (page_count is null or (page_count >= 1 and page_count <= 50000));

comment on column public.books.page_count is '도서 총 페이지(쪽). 관리자·메타데이터용.';
