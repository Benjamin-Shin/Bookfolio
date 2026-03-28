# 포인트·테마·i18n·VIP(구독)·공동서재·출석 — 통합 설계 요약

이 문서는 Bookfolio에서 **포인트 소비(음수 규칙)**, **모바일 테마 확장**, **다국어**, **VIP 구독과 플랜 상限**, **공동(모임) 서재 한도·초대**, **출석체크(일간 활동)** 를 한궤도에 얹기 위한 설계 요약이다. 구현 시 `@history` 및 `docs/bookfolio-db-schema.md`를 함께 갱신한다.

---

## 1. 목표 한 줄

- **비구독:** 무료 한도 + 포인트 적립·차감으로 확장 기능(테마, 추가 공동서재, 추가 초대 등)을 연다.
- **VIP:** 포인트 **소비**는 면제하되, **플랜 JSON `caps`** 로 운영·남용 방지 상한은 유지한다.
- **시간:** DB/API는 **UTC 저장**, UI는 **로컬(로캘·타임존) 표시**; 출석 “하루”는 사용자 **로컬 달력** 기준.

---

## 2. 현재 코드베이스 출발점

| 영역 | 상태 |
| --- | --- |
| 모바일 테마 | `apps/mobile/lib/src/app.dart` 단일 `ThemeData`, 다크/팔레트 확장 없음 |
| i18n | Flutter ARB 미도입 |
| `point_rules.points` | DB `CHECK (>= 0)`; 관리자 UI도 0 이상만 |
| 지급 | `apps/web/src/lib/points/award-points.ts` — `points <= 0`이면 미적용 |
| 관리자 | 포인트 정책·원장은 `apps/web/.../admin/points/`; 사용자 목록에는 잔액·지급 없음 |
| 공동서재 | `app_users.policies_json.sharedLibraryCreateLimit`(기본 1), `createLibrary`에서 검증 |
| 공개 API | 사용자 잔액·차감용 API는 거의 없음 |

---

## 3. 모바일 테마 (확장 가능 구조)

- **`AppThemeId`**: `system`, `light`, `dark`, `vivid`, `pink` 등 안정적 식별자.
- **`AppThemeRegistry`**: id → `ThemeData` (+ 필요 시 `ThemeExtension`).
- **`ThemeController`**: 선택 테마, `ThemeMode`, 잠금 해제 목록 → `MaterialApp`에 연결.
- **기본:** `light` / `dark`(또는 시스템) 무료.
- **유료:** 포인트 차감 이벤트(예: `unlock_theme_pink`, 음수 점수) 또는 **VIP** 시 프리미엄 테마 무료.
- 잠금 상태는 **서버 동기화** 권장(`app_profiles` / entitlement / 원장 `reason`+`ref`).
- 화면의 하드코드 `Color`는 점진적으로 `Theme` 기반으로 이전.

---

## 4. 다국어 (i18n)

- Flutter: `flutter_localizations` + `intl` + ARB + `gen-l10n`.
- 선호 언어: 로컬 저장 → 추후 계정(`app_profiles` 등)과 동기화 가능.
- 웹 Next.js i18n은 별도 범위. **이벤트 코드**는 영문 유지, **표시 문자열만** 번역.

### 4.1 시각 (UTC 저장 · 로컬 표시)

- **저장:** `timestamptz` = UTC, API ISO 8601.
- **표시:** 클라이언트에서 로캘·타임존 반영.
- **출석 일자:** 로컬 `YYYY-MM-DD`(프로필 `iana_timezone` 가칭 또는 요청 시 IANA; 미설정 시 UTC 날짜 폴백 문서화).
- **포인트 규칙 일/월 한도:** 현 구현은 UTC 자정 기준 — 변경 시 규칙·문구 일치 필요.
- **플랜 운영 cap `*_per_day`:** 기본 UTC일 창 권장(전역 남용 방지 단순화).

---

## 5. 포인트 정책

- **음수 규칙:** `point_rules.points`를 `delta`로 쓰는 차감; DB CHECK 제거, 관리자 폼·`tryAwardPointsForEvent` 일반화, **잔액 부족 시 거부**.
- **일/월 한도:** 적립 위주로 두거나 `metadata.cap_scope`(earn_only | all) 등으로 차감과 분리.
- **관리자 지급:** 이벤트 코드 + 멱등 키 / 또는 `admin_adjustment` 직접 조정.

### 5.1 출석체크 (일 1회)

- **목적:** 참여·연속일·통계. **4절 운영 cap과 테이블·의미 분리.**
- **트리거 예:** 독서 이벤트(`user_book_reading_events`), 소장 등록(`user_books`).
- **규칙:** 로컬 달력 같은 날 **최대 1회** 출석 행(`user_daily_check_ins` 등); `first_activity_at`은 UTC.
- **포인트:** `user_book_register` 등 **행위별 적립은 기존대로** (출석과 독립).
- **선택:** `daily_activity_attendance` 보너스 + 멱등 `daily_activity_attendance:${userId}:${localDate}`.

---

## 6. VIP(구독)와 플랜 cap

- **순서:** `resolveActivePlan` → 활성이면 `withinCaps` → 통과 시 **포인트 차감 생략**; 실패 시 `plan_cap_exceeded`. 비활성이면 무료 한도 + 포인트.
- **적립:** VIP도 포인트 적립 가능. **면제는 소비(spend)** 에 한정.
- **데이터:** `subscription_plans`(`caps_json`) + `user_subscriptions`(기간, 선택 `caps_snapshot_json`). MVP는 관리자 수동 부여 가능.
- **VIP 자동 연계(결제 연동):** 구독 결제·갱신·해지에 따른 `user_subscriptions` 자동 반영(웹훅, PG 영수증 검증, 기간 동기화 등)은 **추후 결제 모듈(PG)이 추가될 때** 함께 설계·구현한다. 그 전까지는 관리자 수동 부여·기간 입력으로 VIP를 운영한다.
- **`caps` 예:** `shared_libraries_owned_max`, `shared_library_members_total_max`, `shared_library_invites_per_library_per_month`, `isbn_metadata_lookup_per_day`, `barcode_scan_session_per_day`, `export_user_library_per_day` 등.
- **카운터:** 운영 cap은 `usage_counters` 또는 Redis TTL; 출석은 날짜 유니크 테이블.

---

## 7. 웹 관리자 · 사용자 관리

- 사용자 목록: **포인트 잔액** 컬럼, **지급**(규칙/멱등/메모), (선택) **VIP 기간 부여**.
- 포인트 정책 페이지: 규칙에 **음수** 허용·도움말.

---

## 8. 모바일

- 프로필/설정: 잔액, (선택) 원장, 구독 상태.
- 테마 상점: 비구독은 포인트 차감 API; VIP는 전 프리미엄 또는 플랜 정의.
- API: 웹 규칙에 맞춰 **GET/POST만** (예: 잔액 GET, `POST .../points/apply-event`).

---

## 9. 공동(모임) 서재

- 기본: 일반 회원 `sharedLibraryCreateLimit = 1`.
- **VIP:** 포인트 생략, **`caps`** 로 소유 개수·초대·멤버 상한.
- **비구독 추가 생성:** 예 `shared_library_create_extra` 음수 이벤트 + 멱등 후 생성.
- **초대:** 비구독은 1명 무료, 추가는 예 `shared_library_invite_extra`; VIP는 cap만. (향후 초대 테이블 시 **차감 시점** 통일.)
- `ADMIN`/`STAFF`: `policies_json` 등 기존 예외 유지.

---

## 10. 구현 권장 순서 (참고)

1. DB: `point_rules.points` 음수 + 스키마 문서  
2. VIP: 플랜·구독 테이블, `hasActiveVip` + `withinCaps`  
3. 포인트:apply 함수 일반화(비구독만 차감 경로 명확히)  
4. 출석 테이블·훅  
5. 관리자 UI 음수·사용자 잔액·지급  
6. 공동서재·초대 게이트  
7. 모바일 API + 테마  
8. i18n 인프라  
9. (후순위) 결제(PG) 모듈 + **VIP 자동 연계**(구독·갱신·해지와 DB 동기화)

---

## 11. 공개 API (웹·모바일 세션/Bearer)

- `GET /api/me/points/balance` — `{ balance, vipActive }`
- `POST /api/me/points/apply-event` — JSON `{ eventCode, idempotencyKey, refType?, refId? }` — 응답: `posted` | `vip_spend_exempt` | `duplicate` 등

## 12. 관련 경로 (구현 시)

- 웹 포인트: `apps/web/src/lib/points/`, `apps/web/src/lib/subscription/vip.ts`
- 공동서재: `apps/web/src/lib/libraries/repository.ts`, `shared-library-policy.ts`
- 모바일 진입: `apps/mobile/lib/src/app.dart`, `library_screen.dart` drawer
- DB 문서: `docs/bookfolio-db-schema.md`
- 마이그레이션: `supabase/migrations/0024_points_negative_vip_checkin_timezone.sql`
- 일별 작업: `docs/todo/YYYY-MM-DD.md`
