/**
 * 교보문고 통합 검색 URL(비소장 구매 링크용).
 *
 * @history
 * - 2026-04-08: 관리자 캐논 폼 패턴과 동일 쿼리 스킴
 */
export function buildKyoboBookSearchUrl(keyword: string): string {
  const q = keyword.trim();
  const params = new URLSearchParams();
  params.set("keyword", q);
  params.set("target", "total");
  return `https://search.kyobobook.co.kr/search?${params.toString()}`;
}
