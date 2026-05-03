import type { AladinFeedItem, AladinFeedResult } from "@/lib/aladin/bestseller-feed";
import { fetchAladinItemList } from "@/lib/aladin/item-list";

/** 모바일 `DiscoverScreen`과 동일 — 관심 카테고리 없을 때 소설 기본 CID. */
export const DISCOVERY_DEFAULT_ALADIN_CATEGORY_ID = 112011;

/** `/discovery/bestsellers`·`choice-new` — 관심 CID 합산 후 화면에 올릴 상한. */
export const DISCOVERY_PROFILE_MERGED_LIST_CAP = 30;

/** CID별 API 요청 권수(알라딘 MaxResults 상한 50). 합친 뒤 판매지수로 정렬해 `DISCOVERY_PROFILE_MERGED_LIST_CAP`로 자릅니다. */
export const DISCOVERY_PROFILE_MERGED_PER_CATEGORY_FETCH = 30;

type AladinQueryType = "Bestseller" | "ItemNewSpecial";

/**
 * 프로필의 국내도서 관심 CID마다 알라딘 ItemList를 조회한 뒤, 중복을 제거해 한 목록으로 합칩니다.
 *
 * @history
 * - 2026-05-03: 웹 대시보드 발견 레일·발견 허브용 신규
 * - 2026-05-05: 발견 전체 목록에서 CID당 30권 요청 등 `maxResultsPerRequest` 조정
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

/**
 * 합친 목록을 알라딘 `salesPoint`(판매지수) 내림차순으로 정렬합니다. 없으면 뒤로 밉니다.
 *
 * @history
 * - 2026-05-05: 발견 전체 목록(관심 카테고리 통합) 정렬용
 */
export function sortAladinItemsBySalesPointDesc(items: AladinFeedItem[]): AladinFeedItem[] {
  return [...items].sort((a, b) => {
    const na =
      a.salesPoint != null && Number.isFinite(a.salesPoint) ? a.salesPoint : -1;
    const nb =
      b.salesPoint != null && Number.isFinite(b.salesPoint) ? b.salesPoint : -1;
    if (nb !== na) {
      return nb - na;
    }
    return (a.title || "").localeCompare(b.title || "", "ko");
  });
}

/**
 * 관심 CID마다 조회해 병합·판매지수 정렬 후 최대 `DISCOVERY_PROFILE_MERGED_LIST_CAP`권만 담은 피드.
 *
 * @history
 * - 2026-05-05: `/discovery/bestsellers`·`choice-new` 기본 목록
 */
export async function mergedAladinFeedForProfileDiscoveryList(
  baseUrl: string,
  queryType: AladinQueryType,
  categoryIds: number[],
): Promise<AladinFeedResult> {
  const ids =
    categoryIds.length > 0 ? categoryIds : [DISCOVERY_DEFAULT_ALADIN_CATEGORY_ID];
  const merged = await mergeAladinItemListsForCategories(
    baseUrl,
    queryType,
    ids,
    DISCOVERY_PROFILE_MERGED_PER_CATEGORY_FETCH,
  );
  const sorted = sortAladinItemsBySalesPointDesc(merged);
  const items = sorted.slice(0, DISCOVERY_PROFILE_MERGED_LIST_CAP);
  const label =
    queryType === "Bestseller"
      ? "베스트셀러(관심 카테고리 합산)"
      : "초이스 신간(관심 카테고리 합산)";
  return {
    feedTitle: label,
    feedLink: "",
    query: ids.join(","),
    items,
  };
}
