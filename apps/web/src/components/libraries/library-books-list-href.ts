import type { Route } from "next";

export type LibraryBooksListQuery = {
  genre?: string;
  owner?: string;
};

/**
 * 공동서재 상세 책 목록 링크 (`genre`·`owner` 쿼리 조합).
 *
 * @history
 * - 2026-03-24: 신규 — 장르·소유자 필터가 상호 유지되도록 공통 빌더
 */
export function libraryBooksListHref(
  libraryId: string,
  next: LibraryBooksListQuery
): Route {
  const sp = new URLSearchParams();
  const g = next.genre?.trim();
  const o = next.owner?.trim();
  if (g) sp.set("genre", g);
  if (o) sp.set("owner", o);
  const s = sp.toString();
  const base = `/dashboard/libraries/${libraryId}`;
  return (s ? `${base}?${s}` : base) as Route;
}
