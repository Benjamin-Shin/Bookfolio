/**
 * 여러 멤버의 일→건수 맵을 같은 키 기준으로 합산합니다(모임서가 월간 통계용).
 *
 * @history
 * - 2026-05-04: 신규 — 멤버별 `user_reading_events_calendar` 병합
 */
export function mergeReadingEventDayCountMaps(
  maps: Record<string, number>[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of maps) {
    for (const [k, v] of Object.entries(m)) {
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      out[k] = (out[k] ?? 0) + n;
    }
  }
  return out;
}

/**
 * `user_reading_events_calendar` RPC가 돌려준 일→건수 맵을
 * 해당 UTC 달의 1~4주차 막대 높이(합계)로 묶습니다.
 *
 * @history
 * - 2026-05-03: 신규 — 대시보드 월간 독서 통계 막대용
 */
export function aggregateUtcMonthCalendarToWeekBars(
  dayCounts: Record<string, number>,
  refUtc: Date = new Date(),
): number[] {
  const y = refUtc.getUTCFullYear();
  const m = refUtc.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const weeks = [0, 0, 0, 0];
  for (let d = 1; d <= lastDay; d++) {
    const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const n = dayCounts[key] ?? 0;
    const weekIdx = Math.min(3, Math.floor((d - 1) / 7));
    weeks[weekIdx] += n;
  }
  return weeks;
}
