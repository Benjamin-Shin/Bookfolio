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
