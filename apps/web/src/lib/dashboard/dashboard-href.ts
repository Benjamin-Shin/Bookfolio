import type { Route } from "next";

/** 대시보드 서가 탭(읽기 상태·소장·Hall of Fame). 완독은 도메인 값 `completed`. */
export type DashboardTab =
  | "reading"
  | "unread"
  | "completed"
  | "owned"
  | "hall";

/** 소장 탭 도서 정렬. URL `sort=title`과 대응. */
export type DashboardOwnedSort = "recent" | "title";

/**
 * 쿼리 `tab` 파싱. 생략 시 「읽는 중」.
 *
 * @history
 * - 2026-04-12: `hall` — Hall of Fame 전용 목록
 * - 2026-03-26: 신규 — 서가 탭 URL 공통화
 */
export function parseDashboardTab(raw: string | undefined): DashboardTab {
  if (
    raw === "unread" ||
    raw === "completed" ||
    raw === "owned" ||
    raw === "hall"
  ) {
    return raw;
  }
  /** 예전·직관적 쿼리 값 호환 */
  if (raw === "finished") {
    return "completed";
  }
  return "reading";
}

/**
 * URL `sort` 파싱(소장 탭 제목순).
 *
 * @history
 * - 2026-04-12: 신규 — `list_user_books_paged` 제목순과 연동
 */
export function parseDashboardOwnedSort(
  raw: string | undefined,
): DashboardOwnedSort {
  return raw === "title" ? "title" : "recent";
}

type BuildDashboardHrefOptions = {
  q?: string;
  genre?: string;
  page?: number;
  tab?: DashboardTab;
  /** 소장 탭에서만 목록 정렬에 사용(`sort=title`). */
  ownedSort?: DashboardOwnedSort;
};

/**
 * `/dashboard` 링크·폼용 쿼리 문자열.
 *
 * @history
 * - 2026-04-12: `tab`에 `hall`(Hall of Fame 전용 화면)
 * - 2026-04-12: `ownedSort` — 소장 제목순 URL 유지
 * - 2026-03-26: 신규
 */
export function buildDashboardHref(opts: BuildDashboardHrefOptions): Route {
  const sp = new URLSearchParams();
  const q = opts.q?.trim() ?? "";
  const genre = opts.genre?.trim() ?? "";
  if (q) sp.set("q", q);
  if (genre) sp.set("genre", genre);
  if (opts.page !== undefined && opts.page > 1) {
    sp.set("page", String(opts.page));
  }
  const tab = opts.tab ?? "reading";
  if (tab !== "reading") {
    sp.set("tab", tab);
  }
  if (opts.ownedSort === "title") {
    sp.set("sort", "title");
  }
  const s = sp.toString();
  return (s ? `/dashboard?${s}` : "/dashboard") as Route;
}
