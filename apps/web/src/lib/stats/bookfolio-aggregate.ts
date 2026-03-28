import type { ReadingLeaderboardResponse } from "@bookfolio/shared";

import {
  getReadingLeaderboard,
  parseLeaderboardPayload
} from "@/lib/books/user-book-sidecars";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

import type { RepositoryContext } from "@/lib/books/repository";

export type OwnedBookPopularityEntry = {
  bookId: string;
  title: string;
  coverUrl: string | null;
  ownerCount: number;
};

export type OwnedBookPopularityResponse = {
  top: OwnedBookPopularityEntry[];
};

function getAdminUserId(ctx: RepositoryContext) {
  return { supabase: createSupabaseAdminClient(), userId: ctx.userId };
}

function parsePopularBooksPayload(raw: unknown): OwnedBookPopularityResponse {
  let o = raw;
  if (typeof o === "string") {
    try {
      o = JSON.parse(o) as unknown;
    } catch {
      return { top: [] };
    }
  }
  if (!o || typeof o !== "object") {
    return { top: [] };
  }
  const rec = o as Record<string, unknown>;
  const topRaw = rec.top;
  const top = Array.isArray(topRaw)
    ? topRaw.map((x) => {
        const t = x as Record<string, unknown>;
        return {
          bookId: String(t.bookId ?? ""),
          title: String(t.title ?? ""),
          coverUrl:
            t.coverUrl === null || t.coverUrl === undefined
              ? null
              : String(t.coverUrl),
          ownerCount: Number(t.ownerCount ?? 0)
        };
      })
    : [];
  return { top };
}

/**
 * 북폴리오 집계 API·대시보드용: 소장/완독/포인트 회원 순위 + 다중 소장 도서 TOP.
 *
 * @history
 * - 2026-03-28: 신규 (`0026` RPC `points_leaderboard`, `owned_book_popularity_leaderboard`)
 */
export async function getPointsLeaderboard(
  topN: number,
  context: RepositoryContext
): Promise<ReadingLeaderboardResponse> {
  const { supabase, userId } = getAdminUserId(context);
  const { data, error } = await supabase.rpc("points_leaderboard", {
    p_user_id: userId,
    p_top_n: topN
  });
  if (error) throw error;
  return parseLeaderboardPayload(data);
}

export async function getOwnedBookPopularity(
  topN: number,
  _context: RepositoryContext
): Promise<OwnedBookPopularityResponse> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("owned_book_popularity_leaderboard", {
    p_top_n: topN
  });
  if (error) throw error;
  return parsePopularBooksPayload(data);
}

export type BookfolioAggregatePayload = {
  ownedBooks: ReadingLeaderboardResponse;
  completedBooks: ReadingLeaderboardResponse;
  popularOwnedBooks: OwnedBookPopularityResponse;
  points: ReadingLeaderboardResponse;
};

export async function getBookfolioAggregate(
  topN: number,
  context: RepositoryContext
): Promise<BookfolioAggregatePayload> {
  const capped = Math.min(100, Math.max(1, topN));
  const [ownedBooks, completedBooks, popularOwnedBooks, points] = await Promise.all([
    getReadingLeaderboard("owned", capped, context),
    getReadingLeaderboard("completed", capped, context),
    getOwnedBookPopularity(capped, context),
    getPointsLeaderboard(capped, context)
  ]);
  return { ownedBooks, completedBooks, popularOwnedBooks, points };
}
