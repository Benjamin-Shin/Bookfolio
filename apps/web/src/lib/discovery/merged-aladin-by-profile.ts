import type { AladinFeedItem } from "@/lib/aladin/bestseller-feed";
import { fetchAladinItemList } from "@/lib/aladin/item-list";

/** 모바일 `DiscoverScreen`과 동일 — 관심 카테고리 없을 때 소설 기본 CID. */
export const DISCOVERY_DEFAULT_ALADIN_CATEGORY_ID = 112011;

type AladinQueryType = "Bestseller" | "ItemNewSpecial";

/**
 * 프로필의 국내도서 관심 CID마다 알라딘 ItemList를 조회한 뒤, 중복을 제거해 한 목록으로 합칩니다.
 *
 * @history
 * - 2026-05-03: 웹 대시보드 발견 레일·발견 허브용 신규
 */
export async function mergeAladinItemListsForCategories(
  baseUrl: string,
  queryType: AladinQueryType,
  categoryIds: number[],
  maxResultsPerRequest = 24,
): Promise<AladinFeedItem[]> {
  const ids =
    categoryIds.length > 0 ? categoryIds : [DISCOVERY_DEFAULT_ALADIN_CATEGORY_ID];
  const feeds = await Promise.all(
    ids.map((categoryId) =>
      fetchAladinItemList(baseUrl, {
        queryType,
        categoryId,
        maxResults: maxResultsPerRequest,
      }),
    ),
  );
  const seen = new Set<string>();
  const merged: AladinFeedItem[] = [];
  for (const feed of feeds) {
    for (const item of feed.items) {
      const key =
        item.itemId.trim() !== ""
          ? item.itemId
          : `${item.isbn13}|${item.isbn}|${item.title}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}
