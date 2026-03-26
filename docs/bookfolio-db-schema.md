# Bookfolio DB 스키마 (Supabase / PostgreSQL)

이 문서는 **`supabase/migrations/`** 에 적용된 순서대로 누적된 **현재 `public` 스키마**를 정리한 것이다.  
개별 컬럼·제약의 출처는 마이그레이션 파일명을 참고한다.

> **갱신:** DB를 바꾸는 마이그레이션을 추가·수정할 때 이 문서를 같은 변경과 함께 맞춘다 (`.cursor/rules/db-schema-doc.mdc`).

---

## 확장

| 이름 | 비고 |
| --- | --- |
| `pgcrypto` | `gen_random_uuid()` 등 |

---

## 테이블 요약

| 테이블 | 역할 |
| --- | --- |
| `profiles` | 초기 Supabase Auth 연동용 프로필 (레거시; `auth.users` FK) |
| `app_users` | NextAuth 계정 (실제 앱 사용자 ID) |
| `app_profiles` | `app_users` 1:1 표시명·아바타 |
| `books` | 공유 서지(캐논); ISBN·표지·가격·장르 등 |
| `authors` | 저자 마스터 (이름 정규화·유니크) |
| `book_authors` | `books`–`authors` 다대다, 표시 순서 `position` |
| `user_books` | 개인 소장 한 권(읽기 상태·위치 등); 매체 형식은 `books.format` (`0021`) |
| `user_book_memos` | 개인 소장 한 권당 **여러** 마크다운 메모 (`0018`) |
| `book_one_liners` | 사용자×도서당 1개 공개 한줄평 (`0018`) |
| `user_book_reading_events` | 독서 이벤트 타임라인(본인만 API로 조회) (`0018`) |
| `libraries` | 공동서재 |
| `library_members` | 공동서재 멤버·역할 |
| `library_user_books` | 공동서재에 노출할 `user_books` 매핑 |
| `point_rule_versions` | 포인트 규칙 세트 버전 (`0021`) |
| `point_rules` | 버전별 이벤트 코드·점수·한도 (`0021`, 스텁) |
| `user_points_ledger` | 사용자 포인트 원장 (`0021`) |
| `book_canon_edit_requests` | 캐논(`books`) 수정 제안·감수 상태 (`0021`) |
| `canon_vote_ballots` | 수정안 투표(사용자×요청 1행) (`0021`) |
| `canon_vote_tallies` | 요청별 찬반 집계 (`0021`) |
| `monthly_contribution_rankings` | 월간 기여 순위 스냅샷 (`0021`) |

제거된 테이블(과거 마이그레이션): `library_books`, `library_book_member_states` → `library_user_books` 모델로 대체됨.

---

## `public.profiles`

Supabase Auth `auth.users` 와 1:1. 트리거로 가입 시 행 생성 (`handle_auth_user_created`).

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | `text` | NOT NULL, UNIQUE |
| `display_name` | `text` | |
| `avatar_url` | `text` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

RLS: 본인만 SELECT/UPDATE.

---

## `public.app_users`

NextAuth 전용 사용자. `user_books.user_id` 등이 여기를 참조한다.

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `email` | `text` | NOT NULL, UNIQUE |
| `email_verified` | `timestamptz` | |
| `password_hash` | `text` | |
| `name` | `text` | |
| `image` | `text` | |
| `role` | `text` | NOT NULL, default `'USER'`, CHECK `IN ('ADMIN','USER','STAFF')` (`0021`에서 `STAFF` 추가) |
| `policies_json` | `jsonb` | NOT NULL, default `'{"sharedLibraryCreateLimit":1}'` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` (트리거로 갱신) |

인덱스: `lower(email)`, `role`.  
RLS: 정책 없음 — `anon`/`authenticated` 직접 접근 불가; `service_role`은 RLS 우회.

---

## `public.app_profiles`

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK, FK → `app_users(id)` ON DELETE CASCADE |
| `display_name` | `text` | |
| `avatar_url` | `text` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

RLS: 활성화. 초기 마이그레이션에 테이블 단위 정책 정의 없음 — 실제 접근은 `service_role`/API 패턴을 따름.

---

## `public.books`

공유 도서 메타데이터. 개인 전용 필드는 `user_books`에 둔다.

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `isbn` | `text` | UNIQUE |
| `title` | `text` | NOT NULL |
| `authors` | `text[]` | NOT NULL, default `'{}'` — `book_authors` 트리거와 동기화 |
| `publisher` | `text` | |
| `published_date` | `text` | |
| `cover_url` | `text` | |
| `description` | `text` | |
| `source` | `text` | NOT NULL, default `'manual'` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |
| `price_krw` | `integer` | NULL 또는 ≥ 0 |
| `page_count` | `integer` | NULL 또는 1–50000 (`0020`) |
| `genre_slugs` | `text[]` | NOT NULL, default `'{}'` |
| `literature_region` | `text` | 탐색·필터용 슬러그 |
| `original_language` | `text` | BCP 47 태그 |
| `translators` | `text[]` | NOT NULL, default `'{}'` |
| `api_source` | `text` | 메타 조회 API 식별자 |
| `format` | `text` | NOT NULL, default `'paper'`, CHECK `paper|ebook|audiobook|unknown` — 캐논 매체 구분 (`0021`) |
| `has_genre_slugs` | `boolean` | GENERATED STORED: `cardinality(genre_slugs) > 0` |
| `cover_hosted_on_cloudinary` | `boolean` | GENERATED STORED: `cover_url`이 `res.cloudinary.com` 호스트면 true; 관리자 목록에서 false(미이관·빈 URL) 우선 정렬 |

인덱스: `genre_slugs` GIN, 부분 인덱스 `literature_region`, `original_language`, `(has_genre_slugs, cover_hosted_on_cloudinary, updated_at DESC)` (`0019`).  
RLS: 인증 사용자 SELECT (`Books are authenticated readable`).

---

## `public.authors`

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `text` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

유니크 인덱스: `(lower(trim(btrim(name))))`.  
RLS: 인증 사용자 SELECT.

---

## `public.book_authors`

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `book_id` | `uuid` | PK(복합), FK → `books(id)` ON DELETE CASCADE |
| `author_id` | `uuid` | PK(복합), FK → `authors(id)` ON DELETE RESTRICT |
| `position` | `int` | NOT NULL, default 0 |

인덱스: `author_id`, `(book_id, position)`.  
RLS: 인증 사용자 SELECT.  
트리거: 행 변경 시 해당 `books.authors` 배열 동기화; `authors.name` 변경 시 연결된 도서 배열 갱신.

---

## `public.user_books`

개인 소장. 서지는 `books`에서만 가져오며, `book_id`는 **NOT NULL** (`0007`).

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `app_users(id)` ON DELETE CASCADE |
| `book_id` | `uuid` | NOT NULL, FK → `books(id)` ON DELETE RESTRICT |
| `reading_status` | `text` | NOT NULL, default `'unread'`, CHECK `unread|reading|completed|paused|dropped` |
| `rating` | `int` | CHECK 1–5 |
| `is_owned` | `boolean` | NOT NULL, default true |
| `location` | `text` | 물리적 위치·대여처 등 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

인덱스: `user_id`, `(user_id, reading_status)`. 형식(`format`)은 `books`로 이전 (`0021`).  
RLS: `user_id = auth.uid()` 가 아닌 **소유자 패턴**은 NextAuth 환경에서 `auth.uid()` 미사용일 수 있음 — 앱은 주로 service_role + 서버 검증 (기존 정책: 소유자 읽기/쓰기).

---

## `public.user_book_memos` (`0018`)

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_book_id` | `uuid` | FK → `user_books(id)` ON DELETE CASCADE |
| `body_md` | `text` | NOT NULL, 길이 ≤ 50000 |
| `created_at` / `updated_at` | `timestamptz` | |

인덱스: `(user_book_id, updated_at DESC)`. RLS: 활성화(service_role 패턴).

---

## `public.book_one_liners` (`0018`)

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `app_users` |
| `book_id` | `uuid` | FK → `books` |
| `body` | `text` | NOT NULL, 1–500자 |
| `created_at` / `updated_at` | `timestamptz` | |

유니크: `(user_id, book_id)`. 인덱스: `book_id`. RLS: 활성화.

---

## `public.user_book_reading_events` (`0018`)

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_book_id` | `uuid` | FK → `user_books` |
| `event_type` | `text` | `read_start` \| `progress` \| `read_pause` \| `read_complete` \| `dropped` |
| `payload` | `jsonb` | default `{}` |
| `occurred_at` / `created_at` | `timestamptz` | |

인덱스: `(user_book_id, occurred_at DESC)`, `occurred_at`. RLS: 활성화.

---

## `public.libraries`

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `text` | NOT NULL |
| `description` | `text` | |
| `kind` | `text` | NOT NULL, CHECK `IN ('family','club')` |
| `created_by` | `uuid` | NOT NULL, FK → `app_users(id)` ON DELETE CASCADE (`0023` — 탈퇴 시 본인이 만든 서재 연쇄 삭제) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

인덱스: `created_by`. RLS: 활성화, 직접 정책 없음(service_role 패턴).

---

## `public.library_members`

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `library_id` | `uuid` | PK(복합), FK → `libraries(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | PK(복합), FK → `app_users(id)` ON DELETE CASCADE |
| `role` | `text` | NOT NULL, default `'member'`, CHECK `IN ('owner','member')` |
| `joined_at` | `timestamptz` | NOT NULL, default `now()` |

인덱스: `user_id`.

---

## `public.library_user_books`

공동서재에 올릴 **개인 소장 행** 매핑.

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `library_id` | `uuid` | PK(복합), FK → `libraries(id)` ON DELETE CASCADE |
| `user_book_id` | `uuid` | PK(복합), FK → `user_books(id)` ON DELETE CASCADE |
| `linked_at` | `timestamptz` | NOT NULL, default `now()` |
| `linked_by` | `uuid` | FK → `app_users(id)` ON DELETE SET NULL |

인덱스: `library_id`, `user_book_id`. RLS: 활성화.

---

## `public.point_rule_versions` (`0021`)

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `version` | `int` | NOT NULL, UNIQUE |
| `effective_from` | `timestamptz` | NOT NULL, default `now()` |
| `notes` | `text` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

시드: `version = 1` (스텁 규칙).

---

## `public.point_rules` (`0021`)

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `rule_version_id` | `uuid` | NOT NULL, FK → `point_rule_versions(id)` ON DELETE CASCADE |
| `event_code` | `text` | NOT NULL |
| `points` | `int` | NOT NULL, CHECK `>= 0` |
| `daily_cap_per_user` | `int` | NULL — 해당 이벤트 **지급 건수**의 사용자별 일일 상한(UTC 자정 기준). NULL이면 미적용 |
| `monthly_cap_per_user` | `int` | NULL — 동일, 월간(UTC 월초 기준) 지급 **건수** 상한 |
| `metadata` | `jsonb` | NOT NULL, default `{}` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

UNIQUE `(rule_version_id, event_code)`. 초기 이벤트(`0021`): `canon_edit_approved` 등(점수 0). `0022`·`0023`에서 `join_membership`(가입), `user_book_register`(서재 등록) 시드 — 웹 관리 화면에서 점수·한도 수정 가능.

---

## `public.user_points_ledger` (`0021`)

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | NOT NULL, FK → `app_users(id)` ON DELETE CASCADE |
| `delta` | `int` | NOT NULL |
| `balance_after` | `int` | NOT NULL |
| `reason` | `text` | NOT NULL — 보통 `point_rules.event_code`와 동일 |
| `ref_type` | `text` | NULL |
| `ref_id` | `uuid` | NULL |
| `rule_version_id` | `uuid` | NULL, FK → `point_rule_versions(id)` ON DELETE SET NULL |
| `idempotency_key` | `text` | NOT NULL, UNIQUE |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

인덱스: `(user_id, created_at DESC)`.

---

## `public.book_canon_edit_requests` (`0021`)

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `book_id` | `uuid` | NOT NULL, FK → `books(id)` ON DELETE CASCADE |
| `submitted_by` | `uuid` | NOT NULL, FK → `app_users(id)` ON DELETE CASCADE |
| `proposed_patch` | `jsonb` | NOT NULL |
| `status` | `text` | NOT NULL, default `PENDING`, CHECK `PENDING|APPROVED|REJECTED` |
| `reviewer_user_id` | `uuid` | NULL, FK → `app_users(id)` ON DELETE SET NULL |
| `review_note` | `text` | |
| `reviewed_at` | `timestamptz` | |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL, default `now()`; UPDATE 시 `set_updated_at` 트리거 |

인덱스: `(status)`.

---

## `public.canon_vote_ballots` (`0021`)

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `request_id` | `uuid` | NOT NULL, FK → `book_canon_edit_requests(id)` ON DELETE CASCADE |
| `voter_user_id` | `uuid` | NOT NULL, FK → `app_users(id)` ON DELETE CASCADE |
| `vote` | `int` | NOT NULL, CHECK `-1 또는 1` |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL, default `now()`; UPDATE 시 트리거 |

UNIQUE `(request_id, voter_user_id)`.

---

## `public.canon_vote_tallies` (`0021`)

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `request_id` | `uuid` | PK, FK → `book_canon_edit_requests(id)` ON DELETE CASCADE |
| `up_count` | `int` | NOT NULL, default 0 |
| `down_count` | `int` | NOT NULL, default 0 |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` (UPDATE 트리거) |

---

## `public.monthly_contribution_rankings` (`0021`)

| 컬럼 | 타입 | 제약 / 기본 |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `period_month` | `date` | NOT NULL (월 첫날 등 집계 기준일) |
| `user_id` | `uuid` | NOT NULL, FK → `app_users(id)` ON DELETE CASCADE |
| `rank` | `int` | NOT NULL |
| `points_earned` | `int` | NOT NULL |
| `snapshot_at` | `timestamptz` | NOT NULL, default `now()` |

UNIQUE `(period_month, user_id)`. 인덱스: `(period_month, rank)`.

---

## 공통 트리거·함수 (요약)

| 이름 | 용도 |
| --- | --- |
| `set_updated_at()` | 여러 테이블 `BEFORE UPDATE`에서 `updated_at = now()` |
| `handle_auth_user_created` | `auth.users` INSERT → `profiles` upsert |
| `list_user_books_paged(...)` | 서비스 롤: 페이지 목록; `format`은 `books.format` 기준 필터·반환 (`0021`) |
| `reading_leaderboard(user_id, kind, top_n)` | 서비스 롤: 완독/소장 권수 리더보드 JSON (`0018`) |
| `user_reading_events_calendar(user_id, from, to)` | 서비스 롤: 독서 이벤트 일별 건수 JSON (`0018`) |
| `list_user_owned_genre_slugs(user_id)` | 서비스 롤: 소장(`is_owned`) 도서의 장르 슬러그 목록 JSON |
| `user_owned_books_price_stats(user_id)` | 서비스 롤: 소장 가격 합계 등 JSON (`books.price_krw` 기준) |
| `ensure_author(text)` | 서비스 롤: 저자 마스터 확보 |
| `replace_book_author_links(uuid, text[])` | 서비스 롤: 도서의 `book_authors` 전체 교체 |

RPC의 정확한 시그니처는 최신 정의가 있는 마이그레이션 파일을 본다 (예: `list_user_books_paged` 는 `(uuid,text,int,int,text,text,boolean,text)`).

---

## 마이그레이션 파일 목록 (참조)

`0001` … `0023` — 저장소 `supabase/migrations/` 디렉터리 (`0022`: `join_membership`·`user_book_register` 시드, `0023`: `libraries.created_by` CASCADE 및 `join_membership` 보강).
