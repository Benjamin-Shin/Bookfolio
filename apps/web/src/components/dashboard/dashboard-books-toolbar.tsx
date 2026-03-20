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

export function DashboardBooksToolbar({
  searchQuery,
  page,
  pageSize,
  ownedTotal,
  readingTotal
}: DashboardBooksToolbarProps) {
  const totalPages = Math.max(1, Math.ceil(ownedTotal / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

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
      {totalPages > 1 ? (
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
      ) : null}
    </div>
  );
}
