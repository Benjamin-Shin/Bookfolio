import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildDashboardHref,
  type DashboardTab,
} from "@/lib/dashboard/dashboard-href";

type DashboardBooksToolbarProps = {
  searchQuery: string;
  page: number;
  pageSize: number;
  /** 소장·읽기 전·완독 탭 페이지네이션 총 권수 */
  listTotal: number;
  currentTab: DashboardTab;
  /** URL `genre` — 페이지 링크·폼에 유지(소장 탭) */
  genreSlug?: string;
  /**
   * 실제 렌더된 권수(읽는 중 탭처럼 API total은 더 큰데 화면에 일부만 둘 때).
   * 생략 시 `listTotal`·페이지로 범위 계산.
   */
  renderedCount?: number;
};

/**
 * 대시보드 검색.
 *
 * @history
 * - 2026-03-26: 탭(`tab`)·통계 요약 제거 — 상단 통계 카드·탭 네비로 이전
 * - 2026-03-24: 쿼리 `genre` 유지(`dashboardHref`)
 * - 2026-03-24: 소장 페이지 이전/다음은 `DashboardBooksPagination`으로 분리(책장 바로 아래 배치)
 */
export function DashboardBooksToolbar({
  searchQuery,
  page,
  pageSize,
  listTotal,
  currentTab,
  genreSlug = "",
  renderedCount: renderedCountProp,
}: DashboardBooksToolbarProps) {
  const totalPages = Math.max(1, Math.ceil(listTotal / pageSize));
  const start = listTotal > 0 ? (page - 1) * pageSize + 1 : 0;
  const renderedCount =
    renderedCountProp ??
    (listTotal > 0
      ? Math.max(0, Math.min(pageSize, listTotal - start + 1))
      : 0);
  const end = listTotal > 0 ? start + renderedCount - 1 : 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <form
        action="/dashboard"
        method="get"
        className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center"
      >
        <Input
          name="q"
          type="search"
          placeholder="제목 또는 저자 검색"
          defaultValue={searchQuery}
          className="flex-1"
          autoComplete="off"
        />
        {genreSlug.trim() ? (
          <input type="hidden" name="genre" value={genreSlug.trim()} />
        ) : null}
        {currentTab !== "reading" ? (
          <input type="hidden" name="tab" value={currentTab} />
        ) : null}
        <Button type="submit" variant="secondary" className="sm:w-auto">
          검색
        </Button>
      </form>
      <div className="text-sm text-muted-foreground">
        <p>
          이 탭{" "}
          {listTotal > 0 ? (
            end < listTotal ? (
              <>
                {start.toLocaleString("ko-KR")}–{end.toLocaleString("ko-KR")}권
                표시 · 전체 {listTotal.toLocaleString("ko-KR")}권
              </>
            ) : totalPages > 1 ? (
              <>
                {start.toLocaleString("ko-KR")}–{end.toLocaleString("ko-KR")}권 ·
                총 {listTotal.toLocaleString("ko-KR")}권
              </>
            ) : (
              <>총 {listTotal.toLocaleString("ko-KR")}권</>
            )
          ) : (
            <>표시할 책 0권</>
          )}
        </p>
        {totalPages > 1 ? (
          <p className="mt-0.5 text-xs">{page}/{totalPages}쪽</p>
        ) : null}
      </div>
    </div>
  );
}

type DashboardBooksPaginationProps = {
  searchQuery: string;
  page: number;
  pageSize: number;
  total: number;
  genreSlug?: string;
  tab: DashboardTab;
  /** 접근성·라벨용, 예: 「소장」 */
  sectionLabel: string;
};

/**
 * 읽기 전·완독·소장 탭용 이전/다음(읽는 중은 한 페이지 고정).
 *
 * @history
 * - 2026-03-26: `tab`·`sectionLabel`로 일반화(읽기 전·완독 포함)
 * - 2026-03-24: 쿼리 `genre` 유지(`dashboardHref`)
 * - 2026-03-24: 신규 — 대시보드 소장 구역 하단 페이지네이션
 */
export function DashboardBooksPagination({
  searchQuery,
  page,
  pageSize,
  total,
  genreSlug,
  tab,
  sectionLabel,
}: DashboardBooksPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) {
    return null;
  }
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label={`${sectionLabel} 책 페이지 이동`}
    >
      <p className="text-sm text-muted-foreground">
        {sectionLabel} {total.toLocaleString("ko-KR")}권 · {page}/{totalPages}쪽
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrev} asChild={hasPrev}>
          {hasPrev ? (
            <Link
              href={buildDashboardHref({
                q: searchQuery,
                genre: genreSlug,
                page: page - 1,
                tab,
              })}
              prefetch={false}
            >
              이전
            </Link>
          ) : (
            <span>이전</span>
          )}
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} asChild={hasNext}>
          {hasNext ? (
            <Link
              href={buildDashboardHref({
                q: searchQuery,
                genre: genreSlug,
                page: page + 1,
                tab,
              })}
              prefetch={false}
            >
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
