"use client";

import Link from "next/link";

import type { LibraryAggregatedBookRow } from "@bookfolio/shared";

import {
  BOOKS_PER_VISUAL_ROW,
  chunk,
  shelfLedge,
  shelfRowLedgeMid,
  shelfShell,
  shelfShellBg,
  tiltDegrees,
} from "@/components/books/bookshelf-shared";
import { Badge } from "@/components/ui/badge";

function ownerDisplayName(
  o: LibraryAggregatedBookRow["owners"][number],
): string {
  const n = o.name?.trim();
  return n || o.email || "이름 없음";
}

type LibraryBookshelfProps = {
  libraryId: string;
  books: LibraryAggregatedBookRow[];
};

/**
 * 공동서가 집계 책 목록용 선반 UI (클라이언트 전용 — Link·Badge 하위 트리 하이드레이션 일치).
 *
 * @history
 * - 2026-03-24: `bookshelf.tsx`에서 분리·`"use client"` (서버/클라 DOM 불일치 방지)
 * - 2026-03-24: 책 행 가로 간격 `Bookshelf`와 동일하게 `gap-1.5`·`sm:gap-2`
 * - 2026-03-24: `BOOKS_PER_SHELF` 분할 제거 — 전체 목록을 한 선반 틀에 이어 붙이고 굵은 받침은 맨 아래 행만
 * - 2026-03-24: 신규 — 대시보드 책장과 동일한 선반·표지 배치, 링크는 공동서가 도서 상세
 */
export function LibraryBookshelf({ libraryId, books }: LibraryBookshelfProps) {
  const variant: "reading" | "owned" = "owned";
  const visualRows = chunk(books, BOOKS_PER_VISUAL_ROW);

  return (
    <div className="relative">
      <div
        className={shelfShell[variant]}
        style={{
          backgroundImage: shelfShellBg[variant],
        }}
      >
        <div className="space-y-0">
          {visualRows.map((rowBooks, rowIndex) => {
            const isLastRow = rowIndex === visualRows.length - 1;
            const baseIndex = rowIndex * BOOKS_PER_VISUAL_ROW;
            return (
              <div key={rowIndex} className="relative">
                <div
                  className={
                    "flex min-h-[220px] w-full items-end justify-center gap-1.5 overflow-x-auto overflow-y-hidden pb-16 sm:min-h-[240px] sm:gap-2"
                  }
                >
                  {rowBooks.map((book, i) => (
                    <LibraryBookOnShelf
                      key={book.bookId}
                      libraryId={libraryId}
                      book={book}
                      index={baseIndex + i}
                    />
                  ))}
                </div>
                <div
                  className={
                    isLastRow ? shelfLedge[variant] : shelfRowLedgeMid[variant]
                  }
                  aria-hidden
                />
                {isLastRow ? (
                  <div
                    className="pointer-events-none absolute bottom-0 left-2 right-2 h-3 rounded-full bg-gradient-to-b from-white/25 to-transparent dark:from-white/10"
                    aria-hidden
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LibraryBookOnShelf({
  libraryId,
  book,
  index,
}: {
  libraryId: string;
  book: LibraryAggregatedBookRow;
  index: number;
}) {
  const tilt = tiltDegrees(book.bookId, index);
  const authors = book.authors.join(", ") || "저자 미상";
  const ownerNames = book.owners.map(ownerDisplayName).join(", ");
  const label = `${book.title} — ${authors} · ${ownerNames}`;

  return (
    <Link
      href={`/dashboard/libraries/${libraryId}/books/${book.bookId}`}
      title={label}
      className="group relative shrink-0 outline-none transition-transform duration-200 hover:z-20 hover:-translate-y-2 focus-visible:z-20 focus-visible:-translate-y-2"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="relative w-[4.75rem] origin-bottom sm:w-[5.25rem] md:w-28">
        <div className="aspect-[2/3] overflow-hidden rounded-sm shadow-[4px_6px_14px_oklch(0.25_0.03_55_/_0.45),inset_0_1px_0_oklch(1_0_0_/_0.35)] ring-1 ring-black/20 dark:shadow-[4px_8px_20px_oklch(0.05_0.02_55_/_0.8)] dark:ring-white/10">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-muted via-muted/80 to-muted/60 p-1.5">
              <p className="line-clamp-4 text-[0.6rem] font-semibold leading-tight text-foreground/90 sm:text-[0.65rem]">
                {book.title}
              </p>
              <p className="line-clamp-2 text-[0.55rem] text-muted-foreground sm:text-[0.6rem]">
                {authors}
              </p>
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/35 to-transparent"
            aria-hidden
          />
        </div>
        <div className="mt-1 flex max-w-[4.75rem] flex-wrap justify-center gap-0.5 sm:max-w-[5.25rem] md:max-w-28">
          {book.owners.map((o) => (
            <Badge
              key={o.userId}
              variant="secondary"
              className="min-w-0 max-w-full truncate px-1 py-0 text-[0.55rem] font-normal leading-tight sm:text-[0.6rem]"
              title={ownerDisplayName(o)}
            >
              {ownerDisplayName(o)}
            </Badge>
          ))}
        </div>
        <p className="pointer-events-none absolute -bottom-7 left-1/2 z-10 hidden w-[8.5rem] -translate-x-1/2 text-center text-[0.65rem] font-medium text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 sm:block">
          <span className="line-clamp-2 rounded bg-card/95 px-1.5 py-0.5 ring-1 ring-border/80 backdrop-blur-sm">
            {book.title}
          </span>
        </p>
      </div>
    </Link>
  );
}
