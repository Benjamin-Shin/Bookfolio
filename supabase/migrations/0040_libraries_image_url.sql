-- 모임서가 대표 이미지 URL.
alter table public.libraries
add column if not exists image_url text;

comment on column public.libraries.image_url is '모임서가 대표 이미지 URL';
