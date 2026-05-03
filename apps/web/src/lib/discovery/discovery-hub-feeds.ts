import type { AladinFeedItem } from "@/lib/aladin/bestseller-feed";
import {
  DISCOVERY_DEFAULT_ALADIN_CATEGORY_ID,
  mergeAladinItemListsForCategories,
} from "@/lib/discovery/merged-aladin-by-profile";
import { getAppProfile } from "@/lib/auth/app-profiles";
import { env } from "@/lib/env";
import { buildHybridRecommendations } from "@/lib/recommendations/service";

/** 발견 허브·대시보드 레일 공통 — 섹션당 최대 권수. */
export const DISCOVERY_HUB_BOOK_LIMIT = 5;

export type DiscoveryHubRecItem = Awaited<
  ReturnType<typeof buildHybridRecommendations>
>["items"][number];

export type DiscoveryHubFeeds = {
  categoryHint: string;
  bestsellerItems: AladinFeedItem[];
  choiceItems: AladinFeedItem[];
  recItems: DiscoveryHubRecItem[];
  aladinError: string | null;
  recError: string | null;
};

/**
 * 발견 허브·내 서가 레일에서 공통으로 쓰는 알라딘·맞춤 추천 묶음 로드.
 *
 * @history
 * - 2026-05-03: `/discovery` 허브 실도서 표시용으로 `discovery/page`와 레일에서 공유
 */
export async function loadDiscoveryHubFeeds(userId: string): Promise<DiscoveryHubFeeds> {
  const profile = await getAppProfile(userId);
  const favoriteIds = profile?.favoriteAladinCategoryIds ?? [];
  const categoryIdsForMerge =
    favoriteIds.length > 0 ? favoriteIds : [DISCOVERY_DEFAULT_ALADIN_CATEGORY_ID];
  const usingProfileCategories = favoriteIds.length > 0;
  const categoryHint = usingProfileCategories
    ? `프로필 관심 카테고리 ${favoriteIds.length}개 기준`
    : `기본 카테고리(소설, CID ${DISCOVERY_DEFAULT_ALADIN_CATEGORY_ID})`;

  const baseUrl = env.aladinApiBaseUrl?.trim() || null;
  let bestsellerItems: AladinFeedItem[] = [];
  let choiceItems: AladinFeedItem[] = [];
  let aladinError: string | null = null;
  if (baseUrl) {
    try {
      const [b, c] = await Promise.all([
        mergeAladinItemListsForCategories(baseUrl, "Bestseller", categoryIdsForMerge),
        mergeAladinItemListsForCategories(baseUrl, "ItemNewSpecial", categoryIdsForMerge),
      ]);
      bestsellerItems = b;
      choiceItems = c;
    } catch (e) {
      aladinError =
        e instanceof Error ? e.message : "알라딘 목록을 불러오지 못했습니다.";
    }
  } else {
    aladinError = "ALADIN_API_BASE_URL 가 설정되어 있지 않습니다.";
  }

  let recItems: DiscoveryHubRecItem[] = [];
  let recError: string | null = null;
  try {
    const rec = await buildHybridRecommendations({
      userId,
      limit: DISCOVERY_HUB_BOOK_LIMIT,
    });
    recItems = rec.items;
  } catch (e) {
    recError =
      e instanceof Error ? e.message : "맞춤 추천을 불러오지 못했습니다.";
  }

  return {
    categoryHint,
    bestsellerItems,
    choiceItems,
    recItems,
    aladinError,
    recError,
  };
}
