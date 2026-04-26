# 모임서가: B-1 집계 + `library_books` 폐기 및 매핑 테이블

> **구현 상태**: `supabase/migrations/0010_library_user_books.sql` 및 웹·모바일 API/화면이 이 문서에 맞게 반영됨. 배포 전 `pnpm db-push`(또는 Supabase 마이그레이션 적용) 필요.

## 1. 결정 사항

| 항목                             | 결정                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 카탈로그 모델                    | **B-1만** 사용한다. 모임서가 목록은 **`user_books` 기반**이며, `books`의 `book_id`로 중복을 합친다.                                                                         |
| `library_books`                  | **제거한다.** 모임서가 전용 “한 권” 행·`added_by`·서가별 `location`/`memo` 등 **고유 기능은 없앤다.**                                                                       |
| `library_book_member_states`     | **제거한다.** 읽기 상태는 **`user_books.reading_status`** 만 사용한다.                                                                                                      |
| 멤버 전체 자동 공개 vs 선택 공개 | **선택 공개**를 기본으로 하려면 **`libraries` ↔ `user_books` 매핑 테이블**을 둔다 (아래 3절). 전체 자동 공개만 쓸 경우 매핑 없이 멤버의 모든 `user_books`를 집계할 수 있다. |

## 2. 목표 UX (변경 없음)

- 개인 소장은 `user_books`에만 둔다.
- 모임서가 화면에서는 **그 서가에 올려 둔** 멤버들의 책을 합쳐 보여 준다.
- 같은 `book_id`는 **한 줄**, 줄마다 **소유자(멤버) 이름** 표시.

## 3. 매핑 테이블: `library_user_books`

### 3.1 왜 필요한가

- 멤버십(`library_members`)만으로는 “가입했으니 내 서가 전체가 다 보인다”가 될 수 있다.  
  **책 단위로 모임서가에 올릴지** 정하려면 `library_id`와 **특정 `user_books` 행**을 연결하는 테이블이 필요하다.
- `library_books`는 `book_id`만 묶어 **어느 개인 소장 행과 대응하는지** 알 수 없었다. 매핑은 **`user_book_id` 단위**로 “이 권을 이 서가에 공유”를 표현한다.

### 3.2 스키마(제안)

```sql
-- 모임서가에 노출할 "개인 소장 한 줄"을 지정한다.
create table public.library_user_books (
  library_id uuid not null references public.libraries (id) on delete cascade,
  user_book_id uuid not null references public.user_books (id) on delete cascade,
  -- 선택: 누가 올렸는지 감사/표시용
  linked_at timestamptz not null default now(),
  linked_by uuid references public.app_users (id) on delete set null,
  primary key (library_id, user_book_id)
);

create index idx_library_user_books_user_book_id
  on public.library_user_books (user_book_id);
```

- **`user_books.user_id`가 해당 `library_id`의 멤버인지**는 API·RPC에서 검증한다 (RLS는 기존과 같이 service_role + 앱 검증 패턴 유지 가능).
- 한 `user_book`은 여러 모임서가에 동시에 올릴 수 있음(행마다 `library_id`가 다름).
- `user_books` 삭제 시 매핑은 **CASCADE**로 같이 사라져 목록이 자연스럽게 갱신된다.

### 3.3 집계 쿼리(논리)

1. `library_user_books`에서 `library_id = :id`인 `user_book_id` 목록을 구한다.
2. `user_books` + `books` + `app_users`(소유자 표시)를 조인한다.
3. 화면용으로 **`book_id` 기준으로 그룹화**하고, 소유자 배열을 만든다.

(성능·일관성을 위해 이 로직을 PostgreSQL **RPC** 한 개로 묶는 것을 권장한다.)

### 3.4 매핑 없이 가는 경우 (대안)

- 제품이 “멤버면 개인 서가 전체가 모임서가에 항상 반영”이면 `library_user_books` 없이  
  `library_members`의 `user_id`로 `user_books`만 필터·그룹화하면 된다.
- 이 문서는 **선택 공개(책 단위)** 를 열어 두기 위해 매핑 테이블을 **1급 설계**로 둔다.

## 4. `library_books` / `library_book_member_states` 제거 시 할 일

| 영역                        | 조치                                                                                                                                                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 마이그레이션                | `library_book_member_states` 삭제 → `library_books` 삭제(또는 역순 FK에 맞게).                                                                                                                                                                           |
| 기존 `library_books` 데이터 | `book_id` + `added_by`(또는 소유자 후보)로 해당 사용자의 `user_books`를 찾아 **없으면 `user_books` 생성 후** `library_user_books`에 `(library_id, user_book_id)` 삽입하는 **일회성 백필** 스크립트 검토. 매칭 실패 행은 수동 처리 목록으로 남길 수 있음. |
| API                         | `library_books` id 기반 경로(`.../books/[libraryBookId]`, `my-state` 등) 제거 또는 **`book_id` + `library_id` 기반**으로 단순화.                                                                                                                         |
| Repository                  | `addLibraryBook` / `listLibraryBooks` / `getLibraryBook` / `updateLibraryBook` / `deleteLibraryBook` / `upsertMyLibraryBookState` 를 매핑·집계 모델로 교체.                                                                                              |
| UI                          | 모임서가 상세가 `libraryBookId` 대신 **집계 행(예: `bookId`)** 또는 **소유자별 `userBookId`** 딥링크로 동작하도록 수정.                                                                                                                                  |

모임서가에만 있던 **위치·메모**가 필요하면:

- **개인 필드로만** 쓴다: `user_books.location`, `user_books.memo` 유지.
- “이 서가에서만 다른 메모”가 필요하면 **매핑 테이블에 `note text`** 같은 컬럼을 추가하는 확장만 허용한다 (`library_books` 부활 아님).

## 5. API·타입 방향

### 5.1 공유 계약 (`packages/shared`)

- `LibraryAggregatedBookRow`: `bookId`, 서지 필드, `owners: { userId, name, email?, userBookId, readingStatus, ... }[]`
- `POST .../libraries/:id/books` (또는 `.../share`): body에 `userBookId` 또는 `bookId`(없으면 개인 행 생성 후 매핑) — **실질은 `library_user_books` insert + 멤버십 검증**
- `DELETE`: 매핑 행만 삭제(개인 `user_books`는 유지)가 일반적이다.

### 5.2 서버

- `listLibraryAggregatedBooks(libraryId, actorUserId)`: 매핑 조인 → `book_id` 그룹화.
- `linkUserBookToLibrary` / `unlinkUserBookFromLibrary`: 위 매핑 CRUD + “본인 것만” 또는 owner 정책.

## 6. 작업 순서 제안 (업데이트)

1. 마이그레이션: **`library_user_books` 생성** → (선택) 백필 → **`library_book_member_states` / `library_books` 드롭**
2. RPC 또는 repository 집계 + 링크/언링크 구현
3. contracts + Route Handlers 교체
4. 웹 대시보드 모임서가 목록·추가·제거 UI
5. 모바일 동기화(해당 화면이 있을 때)
6. 기존 `library_books` 백필·검증

## 7. 엣지 케이스

- 동일 사용자·동일 `book_id`의 `user_books`가 여러 줄이면 매핑은 행마다 가능; 집계 시 소유자 배열에서 **같은 `userId` 병합 정책**을 정한다.
- 멤버 탈퇴: `library_members` 삭제 시 해당 사용자의 `library_user_books`를 **함께 지울지**(ON DELETE 트리거 또는 앱 로직) 정책 결정. 남겨 두면 고아 매핑이 생기므로 보통 **탈퇴 시 해당 user의 매핑 일괄 삭제**를 권장한다.

## 8. 요약

- **B-1 고정**, **`library_books` 및 그에 묶인 고유 기능·`library_book_member_states` 제거.**
- 모임서가와 개인 소장의 연결은 **`library_user_books (library_id, user_book_id)`** 로만 둔다.
- 목록은 이 매핑을 통해 잡은 `user_books`를 **`book_id`로 묶어** 소유자 이름을 붙여 표시한다.
- “멤버 전체 서가 자동 공유”만 원하면 매핑 없이 구현할 수 있으나, **책 단위 공개**를 기본으로 하면 매핑 테이블이 필요하다.

---

_문서 기준 코드: `supabase/migrations/0009_shared_libraries.sql`, `apps/web/src/lib/libraries/repository.ts`, `packages/shared/src/contracts.ts`._
