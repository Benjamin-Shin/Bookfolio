"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  spineColorForGenreSlugs,
  spineWidthPxForPages,
} from "@/lib/dashboard/owned-book-spine";
import { buildSpineShelfPages } from "@/lib/dashboard/spine-shelf-pages";

import type { UserBookSummary } from "@bookfolio/shared";

type BookRow = UserBookSummary & { genreSlugs?: string[] };

interface DashboardSpineShelfPaginatedClientProps {
  books: UserBookSummary[];
}

/**
 * 단일 목판 선반에 책등을 한 줄로 두고, 가로 너비를 넘기면 이전/다음 **페이지**로 넘깁니다.
 *
 * @history
 * - 2026-05-03: 신규 — `buildSpineShelfPages`·`ResizeObserver`로 두께 합 기준 분할
 */
export function DashboardSpineShelfPaginatedClient({
  books,
}: DashboardSpineShelfPaginatedClientProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [shelfWidth, setShelfWidth] = useState(0);
  const [spinePage, setSpinePage] = useState(0);

  const measure = useCallback(() => {
    const el = measureRef.current;
    if (!el) return;
    const w = el.clientWidth;
    setShelfWidth(w > 0 ? w : 0);
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, books]);

  useEffect(() => {
    const el = measureRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      return;
    }
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const booksKey = useMemo(() => books.map((b) => b.id).join(","), [books]);

  useEffect(() => {
    setSpinePage(0);
  }, [booksKey]);

  const pages = useMemo(() => {
    const w = shelfWidth > 0 ? shelfWidth : 960;
    return buildSpineShelfPages(books, w);
  }, [books, shelfWidth]);

  useEffect(() => {
    setSpinePage((p) => Math.min(p, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  const current = pages[spinePage] ?? [];
  const totalPages = pages.length;
  const hasPager = totalPages > 1;

  return (
    <div className="mb-16 md:mb-20">
      <div className="flex items-end gap-1 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="mb-10 size-9 shrink-0 border-[#051b0e]/15 bg-white/80 text-[#051b0e] shadow-sm disabled:opacity-40"
          aria-label="책등 이전 페이지"
          disabled={!hasPager || spinePage <= 0}
          onClick={() => setSpinePage((p) => Math.max(0, p - 1))}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>

        <div ref={measureRef} className="min-w-0 flex-1">
          <div
            className="flex min-h-[140px] items-end justify-center gap-x-1 px-1 pb-1 pt-4 sm:justify-start"
            role="list"
          >
            {current.map((book) => {
              const b = book as BookRow;
              const pageTotal = b.readingTotalPages ?? b.pageCount;
              const spineW = spineWidthPxForPages(pageTotal);
              const bg = spineColorForGenreSlugs(b.genreSlugs);
              return (
                <Link
                  key={book.id}
                  href={`/dashboard/books/${book.id}`}
                  className="group flex shrink-0 flex-col items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#051b0e]"
                  role="listitem"
                  title={book.title}
                >
                  <div
                    className="relative flex h-[128px] shrink-0 items-center justify-center overflow-hidden rounded-sm border border-black/15 shadow-[2px_4px_8px_rgba(5,27,14,0.25)] transition-transform group-hover:-translate-y-1"
                    style={{
                      width: spineW,
                      backgroundColor: bg,
                      boxShadow:
                        "inset 2px 0 0 rgba(255,255,255,0.12), inset -2px 0 0 rgba(0,0,0,0.2)",
                    }}
                  >
                    <span
                      className="max-h-[118px] overflow-hidden text-center font-serif text-[10px] font-medium leading-tight tracking-wide text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]"
                      style={{
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                      }}
                    >
                      {book.title}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div
            className="wood-shelf mt-1 h-10 w-full shrink-0 opacity-90"
            aria-hidden
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="mb-10 size-9 shrink-0 border-[#051b0e]/15 bg-white/80 text-[#051b0e] shadow-sm disabled:opacity-40"
          aria-label="책등 다음 페이지"
          disabled={!hasPager || spinePage >= totalPages - 1}
          onClick={() =>
            setSpinePage((p) => Math.min(totalPages - 1, p + 1))
          }
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      {hasPager ? (
        <p className="mt-3 text-center font-sans text-xs tabular-nums text-[#675d53]">
          선반 {spinePage + 1} / {totalPages}
        </p>
      ) : null}
    </div>
  );
}
