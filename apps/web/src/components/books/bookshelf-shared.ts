/**
 * 선반 UI 공통: 권수·청크·기울기·선반 셸 클래스 (React 없음).
 *
 * @history
 * - 2026-03-24: `LibraryBookshelf` 클라이언트 분리에 맞춰 공통 모듈로 추출
 */

export function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/** 한 줄에 표시하는 표지 권수(가로 스크롤·받침 행 단위) */
export const BOOKS_PER_VISUAL_ROW = 6;

/**
 * 물리적 선반 하나당 시각적 행 수(받침 줄 개수).
 * `BOOKS_PER_SHELF === BOOKS_PER_VISUAL_ROW * VISUAL_ROWS_PER_SHELF`로 맞출 것.
 */
export const VISUAL_ROWS_PER_SHELF = 3;

/** 선반(대시보드 소장 `PAGE_SIZE`)당 총 권수 */
export const BOOKS_PER_SHELF = BOOKS_PER_VISUAL_ROW * VISUAL_ROWS_PER_SHELF;

/** 제목·인덱스 기반으로 -3~3° 사이 결정적 기울기 (하이드레이션 일치) */
export function tiltDegrees(bookId: string, index: number): number {
  let h = 0;
  for (let i = 0; i < bookId.length; i++) {
    h = (h + bookId.charCodeAt(i) * (i + 1)) % 7;
  }
  return ((h + index) % 7) - 3;
}

export const shelfShell: Record<"reading" | "owned", string> = {
  reading:
    "rounded-lg border border-sky-950/20 bg-gradient-to-b from-sky-100/50 via-sky-50/25 to-sky-950/10 px-3 pt-6 shadow-inner dark:border-sky-900/35 dark:from-sky-950/45 dark:via-sky-950/25 dark:to-sky-950/55",
  owned:
    "rounded-lg border border-amber-950/15 bg-gradient-to-b from-amber-100/40 via-amber-50/30 to-amber-900/10 px-3 pt-6 shadow-inner dark:border-amber-900/40 dark:from-amber-950/50 dark:via-amber-950/30 dark:to-amber-950/60"
};

export const shelfShellBg: Record<"reading" | "owned", string> = {
  reading:
    "linear-gradient(90deg, oklch(0.55 0.08 230 / 0.07) 0%, transparent 8%, transparent 92%, oklch(0.55 0.08 230 / 0.07) 100%)",
  owned:
    "linear-gradient(90deg, oklch(0.55 0.06 65 / 0.06) 0%, transparent 8%, transparent 92%, oklch(0.55 0.06 65 / 0.06) 100%)"
};

/** 중간 행용 얇은 앞판(받침줄) */
export const shelfRowLedgeMid: Record<"reading" | "owned", string> = {
  reading:
    "relative z-[1] -mt-px h-3 rounded-b-sm border border-t-0 border-sky-950/25 bg-gradient-to-b from-sky-600/75 via-sky-800/90 to-sky-950/95 shadow-[0_4px_12px_oklch(0.22_0.05_230_/_0.22)] dark:border-sky-950 dark:from-sky-800/90 dark:via-sky-900 dark:to-oklch(0.14_0.03_230)",
  owned:
    "relative z-[1] -mt-px h-3 rounded-b-sm border border-t-0 border-amber-950/20 bg-gradient-to-b from-amber-600/80 via-amber-800/90 to-amber-950/95 shadow-[0_4px_12px_oklch(0.2_0.04_55_/_0.25)] dark:border-amber-950 dark:from-amber-800/90 dark:via-amber-900 dark:to-oklch(0.15_0.02_55)"
};

/** 선반 맨 아래 굵은 앞판 */
export const shelfLedge: Record<"reading" | "owned", string> = {
  reading:
    "relative z-[1] -mt-px h-5 rounded-b-md border border-t-0 border-sky-950/30 bg-gradient-to-b from-sky-700/85 via-sky-800 to-sky-950 shadow-[0_8px_24px_oklch(0.22_0.05_230_/_0.3)] dark:border-sky-950 dark:from-sky-800 dark:via-sky-900 dark:to-oklch(0.14_0.03_230)",
  owned:
    "relative z-[1] -mt-px h-5 rounded-b-md border border-t-0 border-amber-950/25 bg-gradient-to-b from-amber-700/90 via-amber-800 to-amber-950 shadow-[0_8px_24px_oklch(0.2_0.04_55_/_0.35)] dark:border-amber-950 dark:from-amber-800 dark:via-amber-900 dark:to-oklch(0.15_0.02_55)"
};
