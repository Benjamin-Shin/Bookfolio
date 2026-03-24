import Link from "next/link";

import type { UserBookSummary } from "@bookfolio/shared";
import { READING_STATUS_LABEL_KO } from "@bookfolio/shared";

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/** 한 줄에 표시하는 표지 권수(가로 스크롤·받침 행 단위) */
export const BOOKS_PER_VISUAL_ROW = 6;

/**
 * 물리적 선반 하나당 시각적 행 수(받침 줄 개수).
 * `BOOKS_PER_SHELF === BOOKS_PER_VISUAL_ROW * VISUAL_ROWS_PER_SHELF`로 맞출 것.
 */
export const VISUAL_ROWS_PER_SHELF = 3;

/** 선반(대시보드 소장 `PAGE_SIZE`)당 총 권수 */
export const BOOKS_PER_SHELF = BOOKS_PER_VISUAL_ROW * VISUAL_ROWS_PER_SHELF;

/** 제목·인덱스 기반으로 -3~3° 사이 결정적 기울기 (하이드레이션 일치) */
function tiltDegrees(bookId: string, index: number): number {
  let h = 0;
  for (let i = 0; i < bookId.length; i++) {
    h = (h + bookId.charCodeAt(i) * (i + 1)) % 7;
  }
  return ((h + index) % 7) - 3;
}

const shelfShell: Record<"reading" | "owned", string> = {
  reading:
    "rounded-lg border border-sky-950/20 bg-gradient-to-b from-sky-100/50 via-sky-50/25 to-sky-950/10 px-3 pt-6 shadow-inner dark:border-sky-900/35 dark:from-sky-950/45 dark:via-sky-950/25 dark:to-sky-950/55",
  owned:
    "rounded-lg border border-amber-950/15 bg-gradient-to-b from-amber-100/40 via-amber-50/30 to-amber-900/10 px-3 pt-6 shadow-inner dark:border-amber-900/40 dark:from-amber-950/50 dark:via-amber-950/30 dark:to-amber-950/60",
};

const shelfShellBg: Record<"reading" | "owned", string> = {
  reading:
    "linear-gradient(90deg, oklch(0.55 0.08 230 / 0.07) 0%, transparent 8%, transparent 92%, oklch(0.55 0.08 230 / 0.07) 100%)",
  owned:
    "linear-gradient(90deg, oklch(0.55 0.06 65 / 0.06) 0%, transparent 8%, transparent 92%, oklch(0.55 0.06 65 / 0.06) 100%)",
};

/** 중간 행용 얇은 앞판(받침줄) */
const shelfRowLedgeMid: Record<"reading" | "owned", string> = {
  reading:
    "relative z-[1] -mt-px h-3 rounded-b-sm border border-t-0 border-sky-950/25 bg-gradient-to-b from-sky-600/75 via-sky-800/90 to-sky-950/95 shadow-[0_4px_12px_oklch(0.22_0.05_230_/_0.22)] dark:border-sky-950 dark:from-sky-800/90 dark:via-sky-900 dark:to-oklch(0.14_0.03_230)",
  owned:
    "relative z-[1] -mt-px h-3 rounded-b-sm border border-t-0 border-amber-950/20 bg-gradient-to-b from-amber-600/80 via-amber-800/90 to-amber-950/95 shadow-[0_4px_12px_oklch(0.2_0.04_55_/_0.25)] dark:border-amber-950 dark:from-amber-800/90 dark:via-amber-900 dark:to-oklch(0.15_0.02_55)",
};

/** 선반 맨 아래 굵은 앞판 */
const shelfLedge: Record<"reading" | "owned", string> = {
  reading:
    "relative z-[1] -mt-px h-5 rounded-b-md border border-t-0 border-sky-950/30 bg-gradient-to-b from-sky-700/85 via-sky-800 to-sky-950 shadow-[0_8px_24px_oklch(0.22_0.05_230_/_0.3)] dark:border-sky-950 dark:from-sky-800 dark:via-sky-900 dark:to-oklch(0.14_0.03_230)",
  owned:
    "relative z-[1] -mt-px h-5 rounded-b-md border border-t-0 border-amber-950/25 bg-gradient-to-b from-amber-700/90 via-amber-800 to-amber-950 shadow-[0_8px_24px_oklch(0.2_0.04_55_/_0.35)] dark:border-amber-950 dark:from-amber-800 dark:via-amber-900 dark:to-oklch(0.15_0.02_55)",
};

type BookshelfProps = {
  books: UserBookSummary[];
  /** 읽는 중 책장 / 소장 책장 톤 구분 */
  variant?: "reading" | "owned";
};

/**
 * 선반 UI: 표지 나열 + 행마다 받침(앞판).
 *
 * @history
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
                          "flex min-h-[200px] w-full items-end justify-center gap-1 overflow-x-auto overflow-y-hidden pb-10 sm:min-h-[220px] sm:gap-1.5"
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
        <p className="pointer-events-none absolute -bottom-7 left-1/2 z-10 hidden w-[8.5rem] -translate-x-1/2 text-center text-[0.65rem] font-medium text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 sm:block">
          <span className="line-clamp-2 rounded bg-card/95 px-1.5 py-0.5 ring-1 ring-border/80 backdrop-blur-sm">
            {book.title}
          </span>
        </p>
      </div>
    </Link>
  );
}
