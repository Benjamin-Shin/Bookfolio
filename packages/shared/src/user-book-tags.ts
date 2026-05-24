/** `user_books.tags` — 책당 최대 개수. */
export const USER_BOOK_TAG_MAX_COUNT = 5;

/** 태그 문자열 최대 길이(자). */
export const USER_BOOK_TAG_MAX_LENGTH = 20;

/** 목록 API·URL에서 「태그 없음」 필터용 내부 값. */
export const USER_BOOK_TAG_UNTAGGED_FILTER = "__untagged__";

/**
 * 사용자 태그 입력을 정규화합니다(공백·중복·개수·길이).
 *
 * @history
 * - 2026-05-24: `user_books.tags` 도입 — 웹·모바일 공통
 */
export function normalizeUserBookTags(raw: unknown): string[] {
  const items: string[] = [];
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === "string") items.push(x);
    }
  } else if (typeof raw === "string") {
    items.push(...raw.split(/[,，]/));
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (let t of items) {
    t = t.trim();
    if (!t) continue;
    if (t.length > USER_BOOK_TAG_MAX_LENGTH) {
      t = t.slice(0, USER_BOOK_TAG_MAX_LENGTH);
    }
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= USER_BOOK_TAG_MAX_COUNT) break;
  }
  return out;
}

/**
 * 쉼표 구분 태그 문자열을 파싱합니다.
 *
 * @history
 * - 2026-05-24: 웹 폼 hidden 필드용
 */
export function parseUserBookTagsCsv(raw: string): string[] {
  return normalizeUserBookTags(raw.split(/[,，]/));
}
