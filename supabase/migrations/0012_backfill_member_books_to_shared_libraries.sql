-- 멤버로만 속한 공동서가: 해당 멤버의 개인 소장을 library_user_books에 연결
-- (초대 후에도 소유자 서가만 보이던 기존 데이터 복구)

insert into public.library_user_books (library_id, user_book_id, linked_at, linked_by)
select lm.library_id,
  ub.id,
  now(),
  lm.user_id
from public.library_members lm
inner join public.user_books ub on ub.user_id = lm.user_id
where lm.role = 'member'
on conflict (library_id, user_book_id) do nothing;
