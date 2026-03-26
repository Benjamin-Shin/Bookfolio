-- 관리자 도서 목록: 장르 없음 다음으로 Cloudinary가 아닌 표지 URL(빈 URL 포함)을 우선 정렬
alter table public.books
  add column if not exists cover_hosted_on_cloudinary boolean
  generated always as (
    case
      when cover_url is null or btrim(cover_url) = '' then false
      when btrim(cover_url) ~* '^https?://([a-z0-9-]+\.)?res\.cloudinary\.com(/|\?|#|$)' then true
      else false
    end
  ) stored;

comment on column public.books.cover_hosted_on_cloudinary is
  'true when cover_url looks like res.cloudinary.com; admin list sorts false first (needs migration off CDN)';

drop index if exists public.idx_books_has_genre_updated;

create index if not exists idx_books_admin_list_sort
  on public.books (has_genre_slugs asc, cover_hosted_on_cloudinary asc, updated_at desc);
