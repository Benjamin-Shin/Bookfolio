import type { Route } from "next";

/** 대시보드 서재 탭(읽기 상태·소장). 완독은 도메인 값 `completed`. */
export type DashboardTab = "reading" | "unread" | "completed" | "owned";

/**
 * 쿼리 `tab` 파싱. 생략 시 「읽는 중」.
 *
 * @history
 * - 2026-03-26: 신규 — 서재 탭 URL 공통화
 */
export function parseDashboardTab(raw: string | undefined): DashboardTab {
  if (raw === "unread" || raw === "completed" || raw === "owned") {
    return raw;
  }
  /** 예전·직관적 쿼리 값 호환 */
  if (raw === "finished") {
    return "completed";
  }
  return "reading";
}

type BuildDashboardHrefOptions = {
  q?: string;
  genre?: string;
  page?: number;
  tab?: DashboardTab;
};

/**
 * `/dashboard` 링크·폼용 쿼리 문자열.
 *
 * @history
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
  const s = sp.toString();
  return (s ? `/dashboard?${s}` : "/dashboard") as Route;
}
