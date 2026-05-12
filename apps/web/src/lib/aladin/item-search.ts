import {
  parseAladinItemListBody,
  type AladinFeedItem,
} from "@/lib/aladin/bestseller-feed";

const ITEM_SEARCH_BASE = "https://www.aladin.co.kr/ttb/api/ItemSearch.aspx";

/**
 * 알라딘 TTB ItemSearch(키워드) — `output=json` 본문은 ItemList와 동일 구조로 파싱합니다.
 *
 * @history
 * - 2026-05-12: 대시보드 통합 검색 3단계(알라딘)용
 * - 2026-05-12: 검색은 `no-store`로 직접 fetch(ItemList 피드와 캐시 정책 분리)
 */
export async function fetchAladinItemSearchKeyword(
  ttbKey: string,
  rawQuery: string,
  maxResults = 10,
): Promise<AladinFeedItem[]> {
  const q = rawQuery.trim();
  if (!q || !ttbKey.trim()) {
    return [];
  }

  const url = new URL(ITEM_SEARCH_BASE);
  url.searchParams.set("ttbkey", ttbKey.trim());
  url.searchParams.set("Query", q);
  url.searchParams.set("QueryType", "Keyword");
  url.searchParams.set("SearchTarget", "Book");
  url.searchParams.set("start", "1");
  url.searchParams.set(
    "MaxResults",
    String(Math.min(50, Math.max(1, Math.floor(maxResults)))),
  );
  url.searchParams.set("Cover", "Mid");
  url.searchParams.set("output", "json");
  url.searchParams.set("Version", "20131101");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    return [];
  }
  const text = await res.text();
  try {
    const { items } = parseAladinItemListBody(text);
    return items;
  } catch {
    return [];
  }
}
