import type { LibraryAggregatedBookRow, UserBookSummary } from "@bookfolio/shared";

function pickDisplayOwner(
  row: LibraryAggregatedBookRow,
): LibraryAggregatedBookRow["owners"][number] | undefined {
  const reading = row.owners.find((o) => o.readingStatus === "reading");
  return reading ?? row.owners[0];
}

/**
 * 모임서가 집계 한 줄을 표지 선반(`EditorialGrid`)용 `UserBookSummary`로 변환.
 * 진행률 등은 집계 API에 없어 탭이 `reading`이어도 막대는 보통 비어 있습니다.
 *
 * @history
 * - 2026-05-04: 신규 — 내 서가 `EditorialGrid` 재사용
 */
export function libraryAggregatedBookToUserBookSummary(
  row: LibraryAggregatedBookRow,
): UserBookSummary | null {
  const o = pickDisplayOwner(row);
  if (!o) {
    return null;
  }
  return {
    id: o.userBookId,
    userId: o.userId,
    bookId: row.bookId,
    isbn: row.isbn,
    title: row.title,
    authors: row.authors,
    format: "paper",
    readingStatus: o.readingStatus,
    rating: o.rating,
    coverUrl: row.coverUrl,
    priceKrw: null,
    isOwned: true,
    location: o.location,
    createdAt: row.updatedAt,
    updatedAt: row.updatedAt,
  };
}

export function libraryAggregatedBooksToUserBookSummaries(
  rows: LibraryAggregatedBookRow[],
): UserBookSummary[] {
  const out: UserBookSummary[] = [];
  for (const row of rows) {
    const u = libraryAggregatedBookToUserBookSummary(row);
    if (u) {
      out.push(u);
    }
  }
  return out;
}
