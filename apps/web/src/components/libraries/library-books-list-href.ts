import type { Route } from "next";

export type LibraryBookTab = "owned" | "reading" | "unread" | "completed" | "hall";

export type LibraryBooksListQuery = {
  genre?: string;
  owner?: string;
  tab?: LibraryBookTab;
  /** 1부터. 1이면 쿼리 생략 */
  page?: number;
};

/**
 * 공동서재 상세 URL (`tab`·`genre`·`owner`·`page`).
 *
 * @history
 * - 2026-04-12: `tab`·`page` — 내 서재형 컬렉션 탭·페이지네이션
 * - 2026-03-24: 신규 — 장르·소유자 필터가 상호 유지되도록 공통 빌더
 */
export function libraryDetailHref(libraryId: string, next: LibraryBooksListQuery): Route {
  const sp = new URLSearchParams();
  const tab = next.tab ?? "owned";
  if (tab !== "owned") {
    sp.set("tab", tab);
  }
  const g = next.genre?.trim();
  const o = next.owner?.trim();
  if (g) sp.set("genre", g);
  if (o) sp.set("owner", o);
  const page = next.page ?? 1;
  if (page > 1) sp.set("page", String(page));
  const s = sp.toString();
  const base = `/dashboard/libraries/${libraryId}`;
  return (s ? `${base}?${s}` : base) as Route;
}

/**
 * @deprecated `libraryDetailHref` 사용 권장
 */
export function libraryBooksListHref(libraryId: string, next: Pick<LibraryBooksListQuery, "genre" | "owner">): Route {
  return libraryDetailHref(libraryId, { ...next, tab: "owned", page: 1 });
}

/**
 * `searchParams.tab` 파싱.
 *
 * @history
 * - 2026-04-12: 신규
 */
export function parseLibraryBookTab(raw: string | undefined): LibraryBookTab {
  if (raw === "reading" || raw === "unread" || raw === "completed" || raw === "hall") {
    return raw;
  }
  return "owned";
}
