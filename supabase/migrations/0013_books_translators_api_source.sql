-- Canonical `books`: 옮긴이(복수 가능), 메타데이터 조회 API 식별
alter table public.books
  add column if not exists translators text[] not null default '{}';

alter table public.books
  add column if not exists api_source text;

comment on column public.books.translators is '옮긴이 이름 목록 (저자와 동일하게 배열)';
comment on column public.books.api_source is 'ISBN·제목 등 외부 메타 조회에 사용된 API 식별 (예: nl.go.kr, naver, googlebooks)';
