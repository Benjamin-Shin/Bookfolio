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
  user_book_register: "user_book_register"
} as const;

export type PointEventCode = (typeof POINT_EVENT_CODES)[keyof typeof POINT_EVENT_CODES];

/** 관리자 화면 도움말용 */
export const POINT_EVENT_CODE_DESCRIPTION_KO: Record<PointEventCode, string> = {
  join_membership: "회원가입(최초 계정 생성) 1회 지급 — 규칙 코드 `join_membership`",
  user_book_register: "내 서재에 도서 등록 시(권당 1회, 일 한도는 규칙 테이블)"
};
