import Link from "next/link";

import type { UserBookSummary } from "@bookfolio/shared";
import { READING_STATUS_LABEL_KO } from "@bookfolio/shared";

import {
  BOOKS_PER_SHELF,
  BOOKS_PER_VISUAL_ROW,
  chunk,
  shelfLedge,
  shelfRowLedgeMid,
  shelfShell,
  shelfShellBg,
  tiltDegrees,
  VISUAL_ROWS_PER_SHELF,
} from "@/components/books/bookshelf-shared";

export {
  BOOKS_PER_SHELF,
  BOOKS_PER_VISUAL_ROW,
  VISUAL_ROWS_PER_SHELF,
} from "@/components/books/bookshelf-shared";

type BookshelfProps = {
  books: UserBookSummary[];
  /** 읽는 중 책장 / 소장 책장 톤 구분 */
  variant?: "reading" | "owned";
};

/**
 * 선반 UI: 표지 나열 + 행마다 받침(앞판).
 *
 * @history
 * - 2026-03-24: 선반 상수·청크·스타일 `bookshelf-shared`로 이전; 공동서가 선반은 `library-bookshelf.tsx`
 * - 2026-03-24: 책 행 가로 간격 `gap-1.5`·`sm:gap-2`로 소폭 확대
 * - 2026-03-24: 책 행 `justify-center`·`w-full`로 가운데 정렬
 * - 2026-03-24: 책 행 `overflow-y-hidden`·행마다 `pb-10`으로 첫 줄 세로 스크롤바 방지
 * - 2026-03-24: `VISUAL_ROWS_PER_SHELF`·export 상수로 줄 수·페이지 권수 동기
 * - 2026-03-24: 한 줄 6권, 선반 덩어리 `BOOKS_PER_SHELF`(`PAGE_SIZE`와 동기)
 * - 2026-03-24: `md:flex-wrap` 제거, `BOOKS_PER_VISUAL_ROW` 단위로 행·받침줄 분리
 */
export function Bookshelf({ books, variant = "owned" }: BookshelfProps) {
  const shelves = chunk(books, BOOKS_PER_SHELF);

  return (
    <div className="space-y-10">
      {shelves.map((shelfBooks, shelfIndex) => {
        const visualRows = chunk(shelfBooks, BOOKS_PER_VISUAL_ROW);
        return (
          <div key={shelfIndex} className="relative">
            <div
              className={shelfShell[variant]}
              style={{
                backgroundImage: shelfShellBg[variant],
              }}
            >
              <div className="space-y-0">
                {visualRows.map((rowBooks, rowIndex) => {
                  const isLastRow = rowIndex === visualRows.length - 1;
                  const baseIndex =
                    shelfIndex * BOOKS_PER_SHELF +
                    rowIndex * BOOKS_PER_VISUAL_ROW;
                  return (
                    <div key={rowIndex} className="relative">
                      <div
                        className={
                          // overflow-x만 스크롤: x-auto+y-visible은 스펙상 y가 auto로 바뀌어 세로 스크롤바가 생길 수 있음
                          "flex min-h-[200px] w-full items-end justify-center gap-1.5 overflow-x-auto overflow-y-hidden pb-10 sm:min-h-[220px] sm:gap-2"
                        }
                      >
                        {rowBooks.map((book, i) => (
                          <BookOnShelf
                            key={book.id}
                            book={book}
                            index={baseIndex + i}
                          />
                        ))}
                      </div>
                      <div
                        className={
                          isLastRow
                            ? shelfLedge[variant]
                            : shelfRowLedgeMid[variant]
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
      })}
    </div>
  );
}

function BookOnShelf({
  book,
  index,
}: {
  book: UserBookSummary;
  index: number;
}) {
  const tilt = tiltDegrees(book.id, index);
  const authors = book.authors.join(", ") || "저자 미상";
  const status =
    READING_STATUS_LABEL_KO[book.readingStatus] ?? book.readingStatus;
  const where = book.location?.trim();
  const label = where
    ? `${book.title} — ${authors} (${status}) · ${where}`
    : `${book.title} — ${authors} (${status})`;

  return (
    <Link
      href={`/dashboard/books/${book.id}`}
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
          {/* 하단 얇은 그림자(책 두께 느낌) */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/35 to-transparent"
            aria-hidden
          />
        </div>
        {/* 호버 시 제목 */}
        <p className="pointer-events-none absolute -bottom-10 left-1/2 z-10 hidden w-[8.5rem] -translate-x-1/2 text-center text-[0.65rem] font-medium text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 sm:-bottom-12 sm:block">
          <span className="line-clamp-2 rounded bg-card/95 px-1.5 py-0.5 ring-1 ring-border/80 backdrop-blur-sm">
            {book.title}
          </span>
        </p>
      </div>
    </Link>
  );
}
