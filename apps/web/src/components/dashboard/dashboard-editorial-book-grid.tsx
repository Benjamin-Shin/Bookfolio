import Link from "next/link";

import {
  BOOKS_PER_VISUAL_ROW,
  chunk,
} from "@/components/books/bookshelf-shared";
import { ShelfPropSprite } from "@/components/dashboard/shelf-prop-sprite";
import {
  pickShelfPropSpriteIds,
} from "@/lib/dashboard/shelf-prop-sprites";
import { cn } from "@/lib/utils";

import type { UserBookSummary } from "@bookfolio/shared";

const showShelfPropSprites =
  process.env.NEXT_PUBLIC_SHELF_PROPS_SPRITE_ENABLED === "1";

/**
 * 읽기 진행률(0–100). 분모는 `readingTotalPages ?? pageCount`.
 *
 * @history
 * - 2026-05-03: `dashboard/page.tsx`에서 분리
 */
export function readingProgressPercent(
  book: UserBookSummary,
): number | null {
  const total = book.readingTotalPages ?? book.pageCount ?? null;
  const cur = book.currentPage;
  if (total == null || total <= 0 || cur == null || cur < 1) {
    return null;
  }
  return Math.min(100, Math.round((cur / total) * 100));
}

function ShelfBookSurface({ book }: { book: UserBookSummary }) {
  const authors = book.authors.join(", ") || "저자 미상";
  if (book.coverUrl) {
    return (
      <img
        src={book.coverUrl}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className="flex h-full w-full flex-col justify-between rounded-sm bg-gradient-to-br from-[#e8ece9] to-[#dfe5e2] p-2 shadow-lg">
      <p className="line-clamp-4 font-serif text-[11px] font-medium leading-tight text-[#1A3C2F]">
        {book.title}
      </p>
      <p className="line-clamp-2 text-[10px] text-[#5c6560]">{authors}</p>
    </div>
  );
}

/**
 * 표지만(오버레이 없음) — 다른 화면에서 재사용할 때.
 *
 * @history
 * - 2026-05-03: `ShelfBookSurface`와 분리(책장 셀은 고정 비율·`<img>` fill 패턴)
 */
export function DashboardShelfBookCover({ book }: { book: UserBookSummary }) {
  const authors = book.authors.join(", ") || "저자 미상";
  if (book.coverUrl) {
    return (
      <img
        src={book.coverUrl}
        alt=""
        className="h-auto max-h-[min(280px,42vw)] w-auto max-w-full object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className="flex aspect-[2/3] w-full max-w-[200px] flex-col justify-between rounded-sm bg-gradient-to-br from-[#e4e2dd] to-[#f0eee9] p-2">
      <p className="line-clamp-4 font-serif text-xs font-medium leading-tight text-[#051b0e]">
        {book.title}
      </p>
      <p className="line-clamp-2 text-[0.65rem] text-[#434843]">{authors}</p>
    </div>
  );
}

function EditorialBookCell({
  book,
  variant,
  indexInRow,
}: {
  book: UserBookSummary;
  variant: "reading" | "owned";
  /** 한 줄 안에서의 0-based 인덱스(기울기·낮춤 이펙트) */
  indexInRow: number;
}) {
  const authors = book.authors.join(", ") || "저자 미상";
  const pct = variant === "reading" ? readingProgressPercent(book) : null;
  const i = indexInRow;

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-[90px] shrink-0",
        i % 3 === 0 && "translate-y-[6px]",
        i % 4 === 0 && "rotate-[-1deg]",
        i % 5 === 0 && "rotate-[1deg]",
      )}
    >
      <Link
        href={`/dashboard/books/${book.id}`}
        title={book.title}
        className="group relative block h-full w-full"
      >
        <div className="relative h-full w-full origin-bottom transition-transform duration-200 ease-out will-change-transform group-hover:-translate-y-2 group-hover:scale-[1.04]">
          <div className="relative h-full w-full overflow-hidden rounded-sm shadow-lg ring-1 ring-black/5">
            <ShelfBookSurface book={book} />
          </div>
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end rounded-sm bg-black/55 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {variant === "reading" ? (
              <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-[#7ecf9e]"
                  style={{
                    width: pct != null ? `${pct}%` : "0%",
                  }}
                />
              </div>
            ) : null}
            <p className="truncate text-xs font-semibold text-white">{book.title}</p>
            <p className="truncate text-[10px] text-white/75">{authors}</p>
            {variant === "reading" ? (
              <p className="mt-1 text-[10px] font-medium text-[#b8f0cf]">
                {pct != null ? `${pct}% 완료` : "진행률 미입력"}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
      <div
        className="pointer-events-none absolute bottom-[-6px] left-1/2 h-[10px] w-[70%] -translate-x-1/2 bg-black/20 blur-md"
        aria-hidden
      />
    </div>
  );
}

/**
 * 내 서가 표지 그리드: 줄마다 얇은 목 선반·표지 호버 시 메타 오버레이.
 *
 * @history
 * - 2026-05-03: 선반 하단 라인 — `10px`×3층(`#d7b07a` 그라데이션·`#8b5e3c`·`black/20 blur-md`)으로 복귀
 * - 2026-05-03: 권마다 `translate-y`·`rotate`·접촉 그림자
 * - 2026-05-03: `NEXT_PUBLIC_SHELF_PROPS_SPRITE_ENABLED=1`일 때 행 양쪽 `ShelfPropSprite`(시드 `L|R-{row}`)
 * - 2026-05-03: 행 래퍼 `rounded-xl`·내부 음영·호버 오버레이
 * - 2026-05-03: 참고 책장 스니펫 반영 — `flex` 행·호버 오버레이
 */
export function EditorialGrid({
  books,
  variant,
}: {
  books: UserBookSummary[];
  variant: "reading" | "owned";
}) {
  const rows = chunk(books, BOOKS_PER_VISUAL_ROW);
  return (
    <div className="mb-8 md:mb-12">
      {rows.map((rowBooks, rowIdx) => (
        <div
          key={rowIdx}
          className="relative mb-12 overflow-hidden rounded-xl bg-gradient-to-b from-[#f8f6f2] to-[#eae3d8] p-6"
        >
          <div
            className="pointer-events-none absolute inset-0 shadow-[inset_0_20px_40px_rgba(0,0,0,0.05)]"
            aria-hidden
          />
          {showShelfPropSprites ? (
            <div className="relative z-10 flex items-end justify-center gap-2 md:gap-4">
              <div className="flex w-[72px] shrink-0 items-end justify-center md:w-[100px]">
                {pickShelfPropSpriteIds(`L-${rowIdx}`, 1).map((id) => (
                  <ShelfPropSprite
                    key={`L-${rowIdx}-${id}`}
                    id={id}
                    className="origin-bottom scale-[0.5] md:scale-[0.58]"
                  />
                ))}
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap items-end justify-center gap-[6px]">
                {rowBooks.map((book, i) => (
                  <EditorialBookCell
                    key={book.id}
                    book={book}
                    variant={variant}
                    indexInRow={i}
                  />
                ))}
              </div>
              <div className="flex w-[72px] shrink-0 items-end justify-center md:w-[100px]">
                {pickShelfPropSpriteIds(`R-${rowIdx}`, 1).map((id) => (
                  <ShelfPropSprite
                    key={`R-${rowIdx}-${id}`}
                    id={id}
                    className="origin-bottom scale-[0.5] md:scale-[0.58]"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex flex-wrap items-end justify-center gap-[6px]">
              {rowBooks.map((book, i) => (
                <EditorialBookCell
                  key={book.id}
                  book={book}
                  variant={variant}
                  indexInRow={i}
                />
              ))}
            </div>
          )}
          <div className="relative z-0 mt-2" aria-hidden>
            <div className="h-[10px] bg-gradient-to-b from-[#d7b07a] to-[#b98a5a]" />
            <div className="h-[10px] bg-[#8b5e3c]" />
            <div className="h-[10px] bg-black/20 blur-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
