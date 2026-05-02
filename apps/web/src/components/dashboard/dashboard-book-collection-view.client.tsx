"use client";

import { BookImage, Library } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EditorialGrid } from "@/components/dashboard/dashboard-editorial-book-grid";
import { DashboardSpineShelfPaginatedClient } from "@/components/dashboard/dashboard-spine-shelf-paginated.client";
import { Button } from "@/components/ui/button";
import {
  DASHBOARD_BOOK_VIEW_STORAGE_KEY,
  DASHBOARD_OWNED_BOOK_VIEW_STORAGE_KEY,
  type DashboardBookViewMode,
} from "@/lib/dashboard/owned-book-spine";
import { cn } from "@/lib/utils";

import type { UserBookSummary } from "@bookfolio/shared";

function readStoredView(): DashboardBookViewMode {
  if (typeof window === "undefined") return "covers";
  try {
    const raw =
      window.localStorage.getItem(DASHBOARD_BOOK_VIEW_STORAGE_KEY) ??
      window.localStorage.getItem(DASHBOARD_OWNED_BOOK_VIEW_STORAGE_KEY);
    return raw === "spine" ? "spine" : "covers";
  } catch {
    return "covers";
  }
}

export interface DashboardBookCollectionViewClientProps {
  books: UserBookSummary[];
  /** `reading`이면 표지 그리드에 진행률 막대 포함 */
  editorialVariant: "reading" | "owned";
}

/**
 * 내 서가 도서 목록: 표지 그리드 ↔ 책등 선반. 선호는 `localStorage`(`DASHBOARD_BOOK_VIEW_STORAGE_KEY`).
 *
 * @history
 * - 2026-05-03: `DashboardOwnedBooksViewClient`에서 일반화 — 전 탭·읽는 중 선반 공통
 * - 2026-05-03: 구 키 `DASHBOARD_OWNED_BOOK_VIEW_STORAGE_KEY` 읽기 호환
 * - 2026-05-03: 책등은 `DashboardSpineShelfPaginatedClient`(단일 선반·가로 페이지)
 */
export function DashboardBookCollectionViewClient({
  books,
  editorialVariant,
}: DashboardBookCollectionViewClientProps) {
  const [mode, setMode] = useState<DashboardBookViewMode>("covers");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMode(readStoredView());
    setMounted(true);
  }, []);

  const setView = useCallback((next: DashboardBookViewMode) => {
    setMode(next);
    try {
      window.localStorage.setItem(DASHBOARD_BOOK_VIEW_STORAGE_KEY, next);
      window.localStorage.setItem(DASHBOARD_OWNED_BOOK_VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="sr-only" id="dash-book-view-toggle-label">
          도서 표시 방식
        </span>
        <div
          className="inline-flex rounded-md border border-[#051b0e]/15 bg-[#f5f3ee]/80 p-0.5 shadow-sm"
          role="group"
          aria-labelledby="dash-book-view-toggle-label"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 gap-1.5 rounded-sm px-2.5 font-sans text-xs",
              mode === "covers"
                ? "bg-white text-[#051b0e] shadow-sm"
                : "text-[#434843] hover:bg-transparent hover:text-[#051b0e]",
            )}
            onClick={() => setView("covers")}
            aria-pressed={mode === "covers"}
          >
            <BookImage className="size-3.5 shrink-0" aria-hidden />
            표지
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 gap-1.5 rounded-sm px-2.5 font-sans text-xs",
              mode === "spine"
                ? "bg-white text-[#051b0e] shadow-sm"
                : "text-[#434843] hover:bg-transparent hover:text-[#051b0e]",
            )}
            onClick={() => setView("spine")}
            aria-pressed={mode === "spine"}
          >
            <Library className="size-3.5 shrink-0" aria-hidden />
            책등
          </Button>
        </div>
      </div>

      {!mounted ? (
        <EditorialGrid books={books} variant={editorialVariant} />
      ) : mode === "spine" ? (
        <DashboardSpineShelfPaginatedClient books={books} />
      ) : (
        <EditorialGrid books={books} variant={editorialVariant} />
      )}
    </div>
  );
}
