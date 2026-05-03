import type { AladinFeedItem } from "@/lib/aladin/bestseller-feed";
import { normalizeIsbn } from "@/lib/books/lookup";

function discoveryByIsbnPath(normalizedDigits: string): `/discovery/books/by-isbn/${string}` | null {
  if (!normalizedDigits) {
    return null;
  }
  return `/discovery/books/by-isbn/${encodeURIComponent(normalizedDigits)}`;
}

/**
 * 알라딘 피드 항목에서 발견 캐논 상세 경로(`/discovery/books/by-isbn/...`).
 *
 * @history
 * - 2026-05-04: 발겱 허브·베스트/초이스 목록 내부 상세 링크
 */
export function discoveryDetailHrefFromAladinItem(item: AladinFeedItem): `/discovery/books/by-isbn/${string}` | null {
  const raw = normalizeIsbn(item.isbn13 || item.isbn || "");
  if (!raw) {
    return null;
  }
  return discoveryByIsbnPath(raw);
}
