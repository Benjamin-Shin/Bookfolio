import type { UserBookDetail, UserBookSummary } from "@bookfolio/shared";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type BookCommunityRating = {
  avg: number;
  count: number;
};

/**
 * `book_id`별 `user_books.rating` 평균·표본 수(값이 있는 행만).
 *
 * @history
 * - 2026-04-02: 신규 — 목록/상세 API에서 회원 평균 별점 노출용
 */
export async function fetchCommunityRatingsByBookIds(bookIds: string[]): Promise<Map<string, BookCommunityRating>> {
  const out = new Map<string, BookCommunityRating>();
  const ids = [...new Set(bookIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    return out;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("user_books").select("book_id, rating").in("book_id", ids).not("rating", "is", null);

  if (error) {
    throw error;
  }

  const sums = new Map<string, { sum: number; count: number }>();
  for (const row of data ?? []) {
    const bid = row.book_id as string;
    const r = row.rating as number;
    if (typeof r !== "number" || !Number.isFinite(r)) {
      continue;
    }
    const cur = sums.get(bid) ?? { sum: 0, count: 0 };
    cur.sum += r;
    cur.count += 1;
    sums.set(bid, cur);
  }

  for (const [bid, { sum, count }] of sums) {
    if (count <= 0) {
      continue;
    }
    out.set(bid, { avg: Math.round((sum / count) * 100) / 100, count });
  }

  return out;
}

/**
 * 요약/상세 행에 `communityRatingAvg`·`communityRatingCount`를 붙입니다.
 *
 * @history
 * - 2026-04-02: 신규
 */
export function mergeCommunityRatingsIntoUserBooks<T extends UserBookSummary | UserBookDetail>(
  items: T[],
  ratings: Map<string, BookCommunityRating>
): T[] {
  return items.map((item) => {
    const s = ratings.get(item.bookId);
    if (!s || s.count <= 0) {
      return { ...item, communityRatingAvg: null, communityRatingCount: 0 };
    }
    return { ...item, communityRatingAvg: s.avg, communityRatingCount: s.count };
  });
}
