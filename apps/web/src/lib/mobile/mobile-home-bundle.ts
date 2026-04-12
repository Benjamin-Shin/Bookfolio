import type { UserBookSummary } from "@bookfolio/shared";

import { getAppProfile } from "@/lib/auth/app-profiles";
import {
  fetchCommunityRatingsByBookIds,
  mergeCommunityRatingsIntoUserBooks
} from "@/lib/books/book-community-ratings";
import { listUserBooksPaged } from "@/lib/books/repository";
import { getUserPointsBalance } from "@/lib/points/balance";
import { getPersonalLibrarySummary } from "@/lib/stats/personal-library-summary";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hasActiveVipSubscription } from "@/lib/subscription/vip";

type EnrichedUserBookSummary = ReturnType<
  typeof mergeCommunityRatingsIntoUserBooks<UserBookSummary>
>;

export type MobileHomeBundlePayload = {
  profile: Awaited<ReturnType<typeof getAppProfile>>;
  personalLibrarySummary: Awaited<ReturnType<typeof getPersonalLibrarySummary>>;
  points: { balance: number; vipActive: boolean } | null;
  readingBook: EnrichedUserBookSummary[number] | null;
  unreadRecommend: EnrichedUserBookSummary;
};

/**
 * 모바일 홈 탭용 데이터를 한 번에 구성합니다 (프로필·요약·포인트·추천 그리드용 도서).
 *
 * @history
 * - 2026-04-12: 신규 — 다중 왕복 제거용 묶음 페이로드
 */
export async function buildMobileHomeBundle(userId: string): Promise<MobileHomeBundlePayload> {
  const ctx = { userId, useAdmin: true } as const;

  const [profile, personalLibrarySummary, pointsResult, booksResult] = await Promise.all([
    getAppProfile(userId).catch(() => null),
    getPersonalLibrarySummary({ userId, useAdmin: true }),
    (async (): Promise<{ balance: number; vipActive: boolean } | null> => {
      try {
        const supabase = createSupabaseAdminClient();
        const [balance, vip] = await Promise.all([
          getUserPointsBalance(supabase, userId),
          hasActiveVipSubscription(supabase, userId)
        ]);
        return { balance, vipActive: vip };
      } catch {
        return null;
      }
    })(),
    (async () => {
      try {
        const [readingPage, unreadPage] = await Promise.all([
          listUserBooksPaged(
            { limit: 1, offset: 0, format: "paper", readingStatus: "reading" },
            ctx
          ),
          listUserBooksPaged(
            { limit: 8, offset: 0, format: "paper", readingStatus: "unread" },
            ctx
          )
        ]);
        const ids = [...readingPage.items, ...unreadPage.items].map((b) => b.bookId);
        const ratings = await fetchCommunityRatingsByBookIds(ids);
        const readingEnriched = mergeCommunityRatingsIntoUserBooks(readingPage.items, ratings);
        const unreadEnriched = mergeCommunityRatingsIntoUserBooks(unreadPage.items, ratings);
        return {
          readingBook: readingEnriched[0] ?? null,
          unreadRecommend: unreadEnriched
        };
      } catch {
        return { readingBook: null, unreadRecommend: [] as EnrichedUserBookSummary };
      }
    })()
  ]);

  const points = pointsResult;
  const readingBook = booksResult.readingBook;
  const unreadRecommend = booksResult.unreadRecommend;

  return {
    profile,
    personalLibrarySummary,
    points,
    readingBook,
    unreadRecommend
  };
}
