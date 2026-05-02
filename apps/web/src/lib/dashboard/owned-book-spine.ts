/**
 * 대시보드 책등 뷰: 쪽수 기반 두께·장르 기반 색상·표시 방식 `localStorage` 키.
 *
 * @history
 * - 2026-05-03: `DASHBOARD_BOOK_VIEW_STORAGE_KEY` 전 탭 공통, 구 키 읽기 호환
 * - 2026-05-03: 최소·최대 두께 상수, 장르 팔레트(슬러그 부분 일치), 모드 타입
 */

/** 내 서가 전역(모든 목록 탭) 표시 방식 저장 키 */
export const DASHBOARD_BOOK_VIEW_STORAGE_KEY = "bookfolio:dashboard-book-view";

/**
 * @deprecated 이전 소장 탭 전용 키. 클라이언트에서 신규 키 없을 때 마이그레이션 읽기용.
 */
export const DASHBOARD_OWNED_BOOK_VIEW_STORAGE_KEY =
  "bookfolio:dashboard-owned-book-view";

export type DashboardBookViewMode = "covers" | "spine";

/** @deprecated `DashboardBookViewMode` 사용 */
export type DashboardOwnedBookViewMode = DashboardBookViewMode;

/** 쪽수 없음·비정상일 때 책등 폭(px) */
export const SPINE_WIDTH_MIN_PX = 10;

/** 총 쪽수 상한에 해당하는 책등 폭(px) */
export const SPINE_WIDTH_MAX_PX = 36;

/** 두께 스케일에 쓰는 쪽수 상한(이 이상은 최대 두께로 클램프) */
export const SPINE_PAGES_SCALE_MAX = 1200;

const NEUTRAL_SPINE = "#5c5f56";

/**
 * `readingTotalPages ?? pageCount` 기준으로 책등 폭(px)을 계산합니다.
 *
 * @history
 * - 2026-05-03: 신규 — 쪽수 없을 때 최소, `SPINE_PAGES_SCALE_MAX`까지 선형 스케일
 */
export function spineWidthPxForPages(pages: number | null | undefined): number {
  if (pages == null || !Number.isFinite(pages) || pages < 1) {
    return SPINE_WIDTH_MIN_PX;
  }
  const p = Math.min(Math.max(Math.floor(pages), 1), SPINE_PAGES_SCALE_MAX);
  const t = (p - 1) / (SPINE_PAGES_SCALE_MAX - 1);
  return Math.round(
    SPINE_WIDTH_MIN_PX + t * (SPINE_WIDTH_MAX_PX - SPINE_WIDTH_MIN_PX),
  );
}

const GENRE_PALETTE: ReadonlyArray<{ keys: readonly string[]; color: string }> =
  [
    {
      keys: [
        "fiction",
        "novel",
        "문학",
        "소설",
        "literature",
        "poetry",
        "시",
      ],
      color: "#4a3728",
    },
    {
      keys: ["history", "역사", "사회", "social", "politics", "정치"],
      color: "#2c3e50",
    },
    {
      keys: [
        "science",
        "과학",
        "computer",
        "it",
        "프로그래밍",
        "tech",
        "수학",
      ],
      color: "#1b4f72",
    },
    {
      keys: ["essay", "에세이", "인문", "humanities", "philosophy", "철학"],
      color: "#6e5a1b",
    },
    {
      keys: [
        "business",
        "경제",
        "자기계발",
        "self-help",
        "management",
        "경영",
      ],
      color: "#1e5631",
    },
    {
      keys: ["art", "예술", "design", "여행", "travel", "요리", "cook"],
      color: "#5b2c6f",
    },
    {
      keys: ["children", "어린이", "유아", "juvenile", "picture-book"],
      color: "#a04012",
    },
  ];

/**
 * `genre_slugs` 배열을 소문자로 합쳐 키워드 부분 일치로 색을 고릅니다.
 *
 * @history
 * - 2026-05-03: 신규 — 미매칭 시 `NEUTRAL_SPINE`
 */
export function spineColorForGenreSlugs(
  slugs: string[] | undefined,
): string {
  if (!slugs?.length) return NEUTRAL_SPINE;
  const joined = slugs.map((s) => s.toLowerCase()).join(" ");
  for (const { keys, color } of GENRE_PALETTE) {
    if (keys.some((k) => joined.includes(k))) return color;
  }
  return NEUTRAL_SPINE;
}
