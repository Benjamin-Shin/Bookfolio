import { spineWidthPxForPages } from "@/lib/dashboard/owned-book-spine";

import type { UserBookSummary } from "@bookfolio/shared";

const GAP_PX = 4;
const H_PADDING_PX = 8;

function spineWidthPx(book: UserBookSummary): number {
  return spineWidthPxForPages(book.readingTotalPages ?? book.pageCount);
}

/**
 * 선반 가로 너비(px) 안에 들어가도록 책을 페이지 단위로 나눕니다(책등 두께 합 기준).
 *
 * @history
 * - 2026-05-03: 신규 — 단일 선반 가로 페이지네이션용
 */
export function buildSpineShelfPages(
  books: UserBookSummary[],
  shelfInnerWidthPx: number,
): UserBookSummary[][] {
  if (books.length === 0) return [];
  const inner = Math.max(0, shelfInnerWidthPx - H_PADDING_PX * 2);
  if (inner <= 0) {
    return [books];
  }

  const pages: UserBookSummary[][] = [];
  let i = 0;
  while (i < books.length) {
    const page: UserBookSummary[] = [];
    let used = 0;
    while (i < books.length) {
      const w = spineWidthPx(books[i]);
      const gap = page.length > 0 ? GAP_PX : 0;
      if (page.length === 0 && w > inner) {
        page.push(books[i]);
        i += 1;
        break;
      }
      if (page.length > 0 && used + gap + w > inner) {
        break;
      }
      page.push(books[i]);
      used += gap + w;
      i += 1;
    }
    if (page.length > 0) {
      pages.push(page);
    } else {
      break;
    }
  }
  return pages.length > 0 ? pages : [[]];
}
