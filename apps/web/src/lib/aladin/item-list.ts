import { fetchAladinItemListFeed, type AladinFeedResult } from "@/lib/aladin/bestseller-feed";

export const ALADIN_ITEM_LIST_DEFAULTS = {
  maxResults: 30,
  start: 1,
  searchTarget: "Book",
  cover: "Big",
  output: "js",
  version: "20131101",
  categoryId: 0
} as const;

export type AladinItemListQueryType =
  | "Bestseller"
  | "ItemNewSpecial"
  | "ItemNewAll";

export type AladinItemListParams = {
  queryType: AladinItemListQueryType;
  categoryId?: number;
  maxResults?: number;
};

/**
 * 알라딘 ItemList URL을 파라미터 조합 방식으로 생성합니다.
 *
 * @history
 * - 2026-04-22: QueryType/CategoryId 기반 조합 유틸 추가
 */
export function buildAladinItemListUrl(baseUrl: string, params: AladinItemListParams): string {
  const url = new URL(baseUrl);
  const categoryId = Number.isFinite(params.categoryId) ? Math.max(0, params.categoryId ?? 0) : 0;
  const maxResults = Number.isFinite(params.maxResults)
    ? Math.max(1, Math.min(50, params.maxResults ?? ALADIN_ITEM_LIST_DEFAULTS.maxResults))
    : ALADIN_ITEM_LIST_DEFAULTS.maxResults;

  url.searchParams.set("QueryType", params.queryType);
  url.searchParams.set("MaxResults", String(maxResults));
  url.searchParams.set("start", String(ALADIN_ITEM_LIST_DEFAULTS.start));
  url.searchParams.set("SearchTarget", ALADIN_ITEM_LIST_DEFAULTS.searchTarget);
  url.searchParams.set("Cover", ALADIN_ITEM_LIST_DEFAULTS.cover);
  url.searchParams.set("output", ALADIN_ITEM_LIST_DEFAULTS.output);
  url.searchParams.set("Version", ALADIN_ITEM_LIST_DEFAULTS.version);
  url.searchParams.set("CategoryId", String(categoryId));
  return url.toString();
}

/**
 * 조합 파라미터로 알라딘 ItemList를 가져옵니다.
 *
 * @history
 * - 2026-04-22: 베스트셀러/초이스 신간 공통 호출 함수 추가
 */
export async function fetchAladinItemList(
  baseUrl: string,
  params: AladinItemListParams
): Promise<AladinFeedResult> {
  const url = buildAladinItemListUrl(baseUrl, params);
  return fetchAladinItemListFeed(url);
}

