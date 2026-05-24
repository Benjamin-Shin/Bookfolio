/** 대시보드 히어로 명언 카드 한 줄 */
export interface DashboardHomeQuote {
  text: string;
  attribution: string;
}

/**
 * 내 서가 히어로 명언 풀. KST 기준 하루에 하나(`pickDashboardHomeQuoteForDay`).
 *
 * @history
 * - 2026-05-24: 신규 — 독서·서가 톤 문장 풀, 일자 시드로 고정 표시
 */
export const DASHBOARD_HOME_QUOTES: readonly DashboardHomeQuote[] = [
  { text: "책은 삶의 조용한 대화다.", attribution: "서가담" },
  {
    text: "오늘 읽을 분량에서 한 문장만 건져도, 그 책은 이미 값어치를 했다.",
    attribution: "서가담",
  },
  {
    text: "한 권의 책은 하나의 세계이고, 마음만 먹으면 언제든 그 문을 열 수 있다.",
    attribution: "서가담",
  },
  {
    text: "독서는 기억이 아니라, 삶으로 끌어오는 일이다.",
    attribution: "서가담",
  },
  {
    text: "책은 숙제가 아니라, 마음에 남는 한 줄을 위한 축제다.",
    attribution: "서가담",
  },
  { text: "책장 한 칸이 곧, 나만의 작은 우주다.", attribution: "서가담" },
  {
    text: "산을 유람하는 것이 책 읽는 것과 같구나.",
    attribution: "이황",
  },
  {
    text: "글 읽기란 산을 오르는 것과 같아, 깊고 얕음은 스스로 깨치는 데 달려 있다.",
    attribution: "이이",
  },
  {
    text: "책 읽는 것, 마치 산에서 노니는 듯—눈길 닿는 곳 즐거움 없는 데 없으리.",
    attribution: "기효람",
  },
  {
    text: "책 없는 방은, 영혼 없는 몸과 같다.",
    attribution: "키케로",
  },
] as const;

const KST_TIME_ZONE = "Asia/Seoul";

/**
 * KST 달력 날짜 `YYYY-MM-DD` (명언 일자 시드용).
 *
 * @history
 * - 2026-05-24: 신규
 */
export function getKstDayKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * KST 기준 그날 고정 명언 1개(같은 날·같은 풀이면 항상 동일 인덱스).
 *
 * @history
 * - 2026-05-24: 신규
 */
export function pickDashboardHomeQuoteForDay(
  quotes: readonly DashboardHomeQuote[] = DASHBOARD_HOME_QUOTES,
  date: Date = new Date(),
): DashboardHomeQuote {
  const dayKey = getKstDayKey(date);
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  const index = hash % quotes.length;
  return quotes[index]!;
}
