-- 이미 존재하는 공동서가: 생성자(created_by)의 개인 소장 전부를 library_user_books에 연결
-- (0010 이후 매핑 없이는 목록이 비어 보이던 기존 서가 복구)

insert into public.library_user_books (library_id, user_book_id, linked_at, linked_by)
select l.id,
  ub.id,
  now(),
  l.created_by
from public.libraries l
inner join public.user_books ub on ub.user_id = l.created_by
on conflict (library_id, user_book_id) do nothing;
