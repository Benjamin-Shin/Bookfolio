import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function dashboardHref(q: string, page: number): Route {
  const sp = new URLSearchParams();
  if (q.trim()) sp.set("q", q.trim());
  if (page > 1) sp.set("page", String(page));
  const s = sp.toString();
  return (s ? `/dashboard?${s}` : "/dashboard") as Route;
}

type DashboardBooksToolbarProps = {
  searchQuery: string;
  page: number;
  pageSize: number;
  /** 소장 책장 페이지네이션·총 권수 기준 */
  ownedTotal: number;
  readingTotal: number;
};

/**
 * 대시보드 검색·권수 요약.
 *
 * @history
 * - 2026-03-24: 소장 페이지 이전/다음은 `DashboardOwnedBooksPagination`으로 분리(책장 바로 아래 배치)
 */
export function DashboardBooksToolbar({
  searchQuery,
  page,
  pageSize,
  ownedTotal,
  readingTotal
}: DashboardBooksToolbarProps) {
  const totalPages = Math.max(1, Math.ceil(ownedTotal / pageSize));

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <form action="/dashboard" method="get" className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          name="q"
          type="search"
          placeholder="제목 또는 저자 검색"
          defaultValue={searchQuery}
          className="flex-1"
          autoComplete="off"
        />
        <Button type="submit" variant="secondary" className="sm:w-auto">
          검색
        </Button>
      </form>
      <div className="text-sm text-muted-foreground">
        <p>
          읽는 중 {readingTotal.toLocaleString("ko-KR")}권 · 소장 {ownedTotal.toLocaleString("ko-KR")}권
        </p>
        <p className="mt-0.5 text-xs">
          페이지는 소장 책장 기준
          {totalPages > 1 ? ` · ${page}/${totalPages}쪽` : null}
        </p>
      </div>
    </div>
  );
}

type DashboardOwnedBooksPaginationProps = {
  searchQuery: string;
  page: number;
  pageSize: number;
  ownedTotal: number;
};

/**
 * 소장 책장 전용 이전/다음(책장 아래에 두어 눈에 잘 띄게 함).
 *
 * @history
 * - 2026-03-24: 신규 — 대시보드 소장 구역 하단 페이지네이션
 */
export function DashboardOwnedBooksPagination({
  searchQuery,
  page,
  pageSize,
  ownedTotal
}: DashboardOwnedBooksPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(ownedTotal / pageSize));
  if (totalPages <= 1) {
    return null;
  }
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label="소장 책 페이지 이동"
    >
      <p className="text-sm text-muted-foreground">
        소장 {ownedTotal.toLocaleString("ko-KR")}권 · {page}/{totalPages}쪽
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrev} asChild={hasPrev}>
          {hasPrev ? (
            <Link href={dashboardHref(searchQuery, page - 1)} prefetch={false}>
              이전
            </Link>
          ) : (
            <span>이전</span>
          )}
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} asChild={hasNext}>
          {hasNext ? (
            <Link href={dashboardHref(searchQuery, page + 1)} prefetch={false}>
              다음
            </Link>
          ) : (
            <span>다음</span>
          )}
        </Button>
      </div>
    </div>
  );
}
