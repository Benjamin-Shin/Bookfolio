import type { UserBookSummary } from "@bookfolio/shared";

import {
  type ShelfPropSpriteId,
  shelfPropHash32,
} from "@/lib/dashboard/shelf-prop-sprites";

/**
 * 책 한 줄에 책·데코를 섞는 규칙(참고 스니펫의 `mixItems` — `Math.random` 대신 시드 해시).
 *
 * @history
 * - 2026-05-03: `DECOR_KIND_IMAGE_URL` — 스프라이트 시트 없이도 `public/assets/shelf-decor/*.svg`로 표시
 * - 2026-05-03: 신규 — `DecorKind`·`mixShelfRowItems`·삽입 확률 18%
 */

export type DecorKind = "plant" | "clock" | "teddy" | "candle";

/** 인라인 `<img>`용(시트 없을 때 기본). PNG로 바꿔도 동일 경로 패턴 유지 가능 */
export const DECOR_KIND_IMAGE_URL: Record<DecorKind, string> = {
  plant: "/assets/shelf-decor/plant.svg",
  clock: "/assets/shelf-decor/clock.svg",
  teddy: "/assets/shelf-decor/teddy.svg",
  candle: "/assets/shelf-decor/candle.svg",
};

/** 향후 `shelf-props.png` 스프라이트로 통합할 때 매핑용 */
export const DECOR_KIND_TO_SPRITE: Record<DecorKind, ShelfPropSpriteId> = {
  plant: "plant_small",
  clock: "alarm_clock",
  teddy: "bear",
  candle: "bubble_candle",
};

const DECOR_ORDER: DecorKind[] = ["plant", "clock", "teddy", "candle"];

/** 각 책 뒤에 데코가 붙을 확률(퍼센트, 참고 스니펫 0.18) */
export const SHELF_DECOR_INSERT_PERCENT = 18;

export type ShelfMixedRowItem =
  | { type: "book"; book: UserBookSummary; bookOrdinal: number }
  | { type: "decor"; kind: DecorKind; imageUrl: string; spriteId: ShelfPropSpriteId };

/**
 * 한 행의 책 배열을 책 + (시드에 따른) 데코 삽입으로 펼칩니다. 같은 `rowSeed`·같은 책 순서면 항상 동일.
 */
export function mixShelfRowItems(
  books: UserBookSummary[],
  rowSeed: string,
): ShelfMixedRowItem[] {
  const out: ShelfMixedRowItem[] = [];
  let bookOrdinal = 0;
  for (let bi = 0; bi < books.length; bi++) {
    const book = books[bi]!;
    out.push({ type: "book", book, bookOrdinal });
    bookOrdinal++;

    const h = shelfPropHash32(`${rowSeed}:${book.id}:${bi}`);
    if ((h % 100) < SHELF_DECOR_INSERT_PERCENT) {
      const kind = DECOR_ORDER[(h >>> 8) % DECOR_ORDER.length]!;
      out.push({
        type: "decor",
        kind,
        imageUrl: DECOR_KIND_IMAGE_URL[kind],
        spriteId: DECOR_KIND_TO_SPRITE[kind],
      });
    }
  }
  return out;
}
