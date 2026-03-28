/**
 * `point_rules.event_code` 상수. DB·관리자 UI·지급 로직에서 동일 문자열을 씁니다.
 *
 * @history
 * - 2026-03-26 — `join_membership`: 가입 포인트(기존 `user_signup` 대체)
 */
export const POINT_EVENT_CODES = {
  /** 이메일 가입 또는 OAuth로 `app_users` 최초 생성 시 1회 */
  join_membership: "join_membership",
  /** 개인 서재에 도서 1권 등록 시 1회(행당 `user_books.id` 멱등) */
  user_book_register: "user_book_register",
  /** 무료/기본 한도를 넘어 공동서재를 추가 생성할 때(음수 규칙, `shared_library_create_extra:libraryId`) */
  shared_library_create_extra: "shared_library_create_extra",
  /** 무료 초대 1명 초과 시 멤버 추가(음수 규칙, 멱등에 libraryId+피초대자) */
  shared_library_invite_extra: "shared_library_invite_extra"
} as const;

export type PointEventCode = (typeof POINT_EVENT_CODES)[keyof typeof POINT_EVENT_CODES];

/** 관리자 화면·힌트용 — 알려진 코드만 */
export const POINT_EVENT_CODE_DESCRIPTION_KO: Partial<Record<string, string>> = {
  join_membership: "회원가입(최초 계정 생성) 1회 지급 — 규칙 코드 `join_membership`",
  user_book_register: "내 서재에 도서 등록 시(권당 1회, 일 한도는 규칙 테이블)",
  shared_library_create_extra:
    "기본 한도 초과 공동서재 추가 생성 시 차감 — 이벤트 `shared_library_create_extra`(서버가 `libraryId` 멱등)",
  shared_library_invite_extra:
    "무료 초대 1명 이후 멤버 추가 시 차감 — `shared_library_invite_extra`(멱등 키에 서재·피초대자)"
};
