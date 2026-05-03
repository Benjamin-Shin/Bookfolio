import type { Route } from "next";
import Link from "next/link";

import {
  BOOKS_PER_VISUAL_ROW,
  chunk,
} from "@/components/books/bookshelf-shared";
import { ShelfDecorInline } from "@/components/dashboard/shelf-decor-inline";
import { mixShelfRowItems } from "@/lib/dashboard/shelf-row-mix";
import { cn } from "@/lib/utils";

import type { UserBookSummary } from "@bookfolio/shared";

/**
 * 책 줄 인라인 데코: 기본 표시. 끄려면 `NEXT_PUBLIC_SHELF_PROPS_SPRITE_DISABLED=1`.
 * (`NEXT_PUBLIC_SHELF_PROPS_SPRITE_ENABLED=0`이면 역시 OFF — 예전 플래그 호환)
 */
function shelfInlineDecorsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_SHELF_PROPS_SPRITE_DISABLED === "1") {
    return false;
  }
  if (process.env.NEXT_PUBLIC_SHELF_PROPS_SPRITE_ENABLED === "0") {
    return false;
  }
  return true;
}

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
  tiltPatternIndex,
  getBookHref,
}: {
  book: UserBookSummary;
  variant: "reading" | "owned";
  /** 줄 안에서 몇 번째 책인지(0-based) */
  indexInRow: number;
  /** 책+데코 혼합 줄에서의 인덱스(참고 스니펫 `mixed.map`의 `idx`); 생략 시 `indexInRow` */
  tiltPatternIndex?: number;
  /** 기본: `/dashboard/books/:userBookId` */
  getBookHref?: (book: UserBookSummary) => string;
}) {
  const authors = book.authors.join(", ") || "저자 미상";
  const pct = variant === "reading" ? readingProgressPercent(book) : null;
  const i = tiltPatternIndex ?? indexInRow;
  const href = (getBookHref?.(book) ??
    `/dashboard/books/${book.id}`) as Route;
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
        href={href}
        title={book.title}
        className="group relative block h-full w-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
      >
        <div className="relative h-full w-full origin-bottom transition-transform duration-200 ease-out will-change-transform group-hover:-translate-y-2 group-hover:scale-[1.04]">
          <div className="relative h-full w-full overflow-hidden rounded-sm shadow-lg ring-1 ring-black/[0.06]">
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
        className="pointer-events-none absolute bottom-[-5px] left-1/2 h-[8px] w-[72%] -translate-x-1/2 bg-black/25 blur-[6px]"
        aria-hidden
      />
    </div>
  );
}

/**
 * 표지 그리드 행 하단 — 벽에 거는 목판(상면·전면)·양끝 코벨·벽 그림자.
 *
 * @history
 * - 2026-05-03: `shelfRowLedgeMid`/`shelfLedge` 시도 후, 스니펫 4층 스트립으로 재정렬
 * - 2026-05-03: 참고 UI — 두께감 있는 목 선반·드롭 섀도·코벨
 */
/**
 * 양끝 목재 브래킷(코벨) — `EditorialShelf` 전용.
 *
 * @history
 * - 2026-05-03: 참고 벽걸이 책장 UI에 맞춰 `clipPath` 사다리꼴·그라데이션
 */
function ShelfCorbel() {
  return (
    <div
      className="h-[15px] w-[11px] shrink-0 bg-gradient-to-b from-[#c49a72] via-[#9a6e45] to-[#6b4528] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),inset_-1px_0_2px_rgba(0,0,0,0.12)]"
      style={{ clipPath: "polygon(18% 0, 82% 0, 100% 100%, 0% 100%)" }}
    />
  );
}

function EditorialShelf() {
  return (
    <div className="relative mx-auto mt-3 w-full max-w-full px-1 sm:px-2" aria-hidden>
      <div className="relative z-[1] flex items-end justify-center gap-0">
        <div className="flex shrink-0 flex-col justify-end pb-px opacity-95">
          <ShelfCorbel />
        </div>
        <div className="relative min-w-0 flex-1 shadow-[0_12px_24px_-6px_rgba(0,0,0,0.22)]">
          <div className="h-[6px] rounded-t-[4px] bg-gradient-to-b from-[#f0e0cc] via-[#deb887] to-[#c9a06e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.08)]" />
          <div className="h-[13px] rounded-b-[5px] border-t border-[#8f6239]/60 bg-gradient-to-b from-[#b88956] via-[#8f6239] to-[#5c3d24] shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2)]" />
        </div>
        <div className="flex shrink-0 flex-col justify-end pb-px opacity-95">
          <ShelfCorbel />
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-1 left-[6%] right-[6%] z-0 h-6 rounded-[50%] bg-black/[0.12] blur-[18px]" />
    </div>
  );
}

/**
 * 내 서가 표지 그리드: 줄마다 얇은 목 선반·표지 호버 시 메타 오버레이.
 *
 * @history
 * - 2026-05-04: `getBookHref` — 모임서가 등 대시보드 외 상세 링크
 * - 2026-05-03: 데코 — `mixShelfRowItems` 인라인 삽입·`ShelfDecorInline`(참고 `mixItems`/`DecorItem`, 시드 고정)
 * - 2026-05-03: 선반·벽 — 밝은 단색 벽(`#f0f0f0`대)·목판 상·전면·코벨·하단 그림자(`EditorialShelf`)
 * - 2026-05-03: 권마다 `translate-y`·`rotate`·접촉 그림자
 * - 2026-05-03: 인라인 데코 기본 ON·`SHELF_PROPS_SPRITE_DISABLED=1`일 때만 OFF
 * - 2026-05-03: 행 래퍼 `rounded-xl`·내부 음영·호버 오버레이
 * - 2026-05-03: 참고 책장 스니펫 반영 — `flex` 행·호버 오버레이
 */
export function EditorialGrid({
  books,
  variant,
  getBookHref,
}: {
  books: UserBookSummary[];
  variant: "reading" | "owned";
  getBookHref?: (book: UserBookSummary) => string;
}) {
  const rows = chunk(books, BOOKS_PER_VISUAL_ROW);
  return (
    <div className="mb-8 md:mb-12">
      {rows.map((rowBooks, rowIdx) => (
        <div
          key={rowIdx}
          className="relative mb-12 overflow-hidden rounded-xl border border-black/[0.06] bg-[#f0f0f0] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_0_0_1px_rgba(255,255,255,0.35)]"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_70%_at_50%_8%,rgba(0,0,0,0.045),transparent_62%)]"
            aria-hidden
          />
          <div className="relative z-10 flex flex-wrap items-end justify-center gap-[6px] pb-1">
            {shelfInlineDecorsEnabled()
              ? mixShelfRowItems(rowBooks, `row-${rowIdx}`).map((item, idx) =>
                  item.type === "book" ? (
                    <EditorialBookCell
                      key={item.book.id}
                      book={item.book}
                      variant={variant}
                      indexInRow={item.bookOrdinal}
                      tiltPatternIndex={idx}
                      getBookHref={getBookHref}
                    />
                  ) : (
                    <ShelfDecorInline
                      key={`decor-${rowIdx}-${idx}-${item.kind}`}
                      kind={item.kind}
                    />
                  )
                )
              : rowBooks.map((book, i) => (
                  <EditorialBookCell
                    key={book.id}
                    book={book}
                    variant={variant}
                    indexInRow={i}
                    getBookHref={getBookHref}
                  />
                ))}
          </div>
          <EditorialShelf />
        </div>
      ))}
    </div>
  );
}
