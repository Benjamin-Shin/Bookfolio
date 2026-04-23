import type { Route } from "next";
import Link from "next/link";

import {
  libraryDetailHref,
  type LibraryBookTab,
} from "@/components/libraries/library-books-list-href";
import { Button } from "@/components/ui/button";

type LibraryBooksPaginationProps = {
  libraryId: string;
  page: number;
  pageSize: number;
  total: number;
  tab: LibraryBookTab;
  genreSlug?: string;
  ownerUserId?: string;
  /** 접근성·라벨 */
  sectionLabel: string;
};

/**
 * 공동서가 상세 — 탭별 책 목록 이전/다음.
 *
 * @history
 * - 2026-04-12: 신규
 */
export function LibraryBooksPagination({
  libraryId,
  page,
  pageSize,
  total,
  tab,
  genreSlug = "",
  ownerUserId = "",
  sectionLabel,
}: LibraryBooksPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) {
    return null;
  }
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const href = (p: number): Route =>
    libraryDetailHref(libraryId, {
      tab,
      genre: genreSlug.trim() || undefined,
      owner: ownerUserId.trim() || undefined,
      page: p > 1 ? p : undefined,
    });

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-[#051b0e]/10 bg-[#f5f3ee]/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label={`${sectionLabel} 책 페이지 이동`}
    >
      <p className="text-sm text-[#434843]">
        {sectionLabel} {total.toLocaleString("ko-KR")}권 · {page}/{totalPages}쪽
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          asChild={hasPrev}
        >
          {hasPrev ? (
            <Link href={href(page - 1)} prefetch={false}>
              이전
            </Link>
          ) : (
            <span>이전</span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          asChild={hasNext}
        >
          {hasNext ? (
            <Link href={href(page + 1)} prefetch={false}>
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
