/**
 * 인메모리 슬라이딩 윈도 레이트 리밋(서버리스 인스턴스당). 남용 완화용.
 *
 * @history
 * - 2026-04-10: 신규 — 클라이언트 오류 수집 POST
 */
const buckets = new Map<string, number[]>();

export function isClientErrorRateLimited(clientKey: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = buckets.get(clientKey) ?? [];
  const pruned = arr.filter((t) => now - t < windowMs);
  if (pruned.length >= limit) {
    buckets.set(clientKey, pruned);
    return true;
  }
  pruned.push(now);
  buckets.set(clientKey, pruned);
  return false;
}
