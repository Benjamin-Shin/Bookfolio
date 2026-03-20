-- Canonical `books`: 탐색·필터용 축 (관리자 큐레이션; 미입력은 NULL / genre_slugs 빈 배열)
alter table public.books
  add column if not exists genre_slugs text[] not null default '{}';

alter table public.books
  add column if not exists literature_region text;

alter table public.books
  add column if not exists original_language text;

comment on column public.books.genre_slugs is '장르·주제 슬러그 목록 (앱에서 허용 목록과 매칭)';
comment on column public.books.literature_region is '문학권·지역 슬러그 (예: korean, english_us)';
comment on column public.books.original_language is '원작 언어 BCP 47 태그 (예: ko, en)';

-- 필터: 장르 겹침(overlap), 단일 값 등등
create index if not exists idx_books_genre_slugs on public.books using gin (genre_slugs);

create index if not exists idx_books_literature_region on public.books (literature_region)
  where literature_region is not null;

create index if not exists idx_books_original_language on public.books (original_language)
  where original_language is not null;
