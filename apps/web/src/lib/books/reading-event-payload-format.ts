import type { ReadingEventRow } from "@bookfolio/shared";
import { effectiveReadingTotalPages } from "@bookfolio/shared";

export type ReadingTotalsForEvents = {
  pageCount?: number | null;
  readingTotalPages?: number | null;
};

/**
 * 독서 이벤트 타임라인용 — `progress`는 쪽·진행률로 풀어 쓰고, 그 외는 JSON 대신 짧은 문장.
 *
 * @history
 * - 2026-05-03: `progress` + `effectiveReadingTotalPages` 기반 진행률·가독 문구
 */
export function summarizeReadingEvent(
  ev: ReadingEventRow,
  totals: ReadingTotalsForEvents,
): { title: string; subtitle: string | null } {
  const totalPages = effectiveReadingTotalPages(totals);
  const p = ev.payload ?? {};

  switch (ev.eventType) {
    case "progress": {
      const cur = readPositiveInt(p, "currentPage");
      if (cur == null) {
        return {
          title: "진도·페이지 저장",
          subtitle: "저장된 쪽 번호가 없습니다.",
        };
      }
      const curN = cur;
      if (totalPages != null && totalPages >= 1) {
        const rawPct = Math.round((curN / totalPages) * 100);
        const pct = Math.min(100, Math.max(0, rawPct));
        const over = curN > totalPages;
        return {
          title: `${curN.toLocaleString("ko-KR")}쪽까지`,
          subtitle: over
            ? `등록된 전체 ${totalPages.toLocaleString("ko-KR")}쪽을 넘겼습니다. (비율 약 ${rawPct}%)`
            : `전체 ${totalPages.toLocaleString("ko-KR")}쪽 중 약 ${pct}%`,
        };
      }
      return {
        title: `${curN.toLocaleString("ko-KR")}쪽까지 읽음`,
        subtitle:
          "서지·내 서가에 전체 쪽수가 있으면 진행률을 함께 표시합니다.",
      };
    }
    case "read_start":
      return { title: "읽기 시작", subtitle: null };
    case "read_pause":
      return { title: "읽기 중지", subtitle: null };
    case "read_complete":
      return { title: "완독", subtitle: null };
    case "dropped":
      return { title: "하차", subtitle: null };
    default:
      return fallbackFromPayload(p);
  }
}

/**
 * 알 수 없는 이벤트 타입·추가 필드가 있을 때만 요약 문자열.
 *
 * @history
 * - 2026-05-03: 신규
 */
export function payloadFallbackNote(
  payload: Record<string, unknown>,
): string | null {
  const keys = Object.keys(payload).filter((k) => !k.startsWith("_"));
  if (keys.length === 0) return null;
  try {
    return JSON.stringify(payload);
  } catch {
    return null;
  }
}

function readPositiveInt(
  payload: Record<string, unknown>,
  key: string,
): number | null {
  const v = payload[key];
  if (typeof v === "number" && Number.isFinite(v) && v > 0) {
    return Math.floor(v);
  }
  if (typeof v === "string" && /^\d+$/.test(v.trim())) {
    const n = parseInt(v.trim(), 10);
    if (n > 0) return n;
  }
  return null;
}

function fallbackFromPayload(
  payload: Record<string, unknown>,
): { title: string; subtitle: string | null } {
  const note = payloadFallbackNote(payload);
  if (!note) {
    return { title: "기록", subtitle: null };
  }
  return { title: "추가 데이터", subtitle: note };
}
