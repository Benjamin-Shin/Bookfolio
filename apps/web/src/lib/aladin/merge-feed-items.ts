import { aladinFeedItemDbIsbnKeys } from "./admin-book-prefill";
import type { AladinFeedItem } from "./bestseller-feed";

/**
 * 베스트셀러 → 초이스·신간 순으로 합치되, ISBN(10/13 변형 포함) 기준으로 한 권만 남깁니다.
 *
 * @history
 * - 2026-03-26: 관리자 알라딘 일괄 등록용
 */
export function mergeAladinFeedItemsDeduped(bestseller: AladinFeedItem[], itemNew: AladinFeedItem[]): AladinFeedItem[] {
  const out: AladinFeedItem[] = [];
  const seenKeys = new Set<string>();

  function tryAdd(item: AladinFeedItem) {
    const keys = aladinFeedItemDbIsbnKeys(item);
    if (keys.length === 0) return;
    if (keys.some((k) => seenKeys.has(k))) return;
    out.push(item);
    for (const k of keys) seenKeys.add(k);
  }

  for (const item of bestseller) tryAdd(item);
  for (const item of itemNew) tryAdd(item);
  return out;
}
