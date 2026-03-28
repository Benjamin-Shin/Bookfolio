-- 정책: ISBN 메타 조회에 Google Books API는 사용하지 않음(`lookup.ts`).
-- 기존 행에 api_source = googlebooks 가 남아 있을 수 있어 주석에만 명시.
comment on column public.books.api_source is 'ISBN·제목 등 외부 메타 조회에 사용된 API 식별 (예: nl.go.kr, naver; 과거 googlebooks 값이 있을 수 있음)';
