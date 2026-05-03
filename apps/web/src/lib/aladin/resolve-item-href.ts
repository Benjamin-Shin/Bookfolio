import type { AladinFeedItem } from "@/lib/aladin/bestseller-feed";

/**
 * 피드 `link` 또는 ISBN으로 알라딘 상품 페이지 URL을 만듭니다.
 *
 * @history
 * - 2026-05-03: `aladin-ttb-item-list-view`와 공유 — 발견 레일 링크용 분리
 */
export function resolveAladinItemHref(item: AladinFeedItem): string | null {
  const fromFeed = item.link?.trim();
  if (fromFeed) {
    return fromFeed;
  }
  const isbn = (item.isbn13 || item.isbn || "").replace(/[^0-9Xx]/g, "");
  if (!isbn) {
    return null;
  }
  return `https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${encodeURIComponent(isbn)}`;
}
