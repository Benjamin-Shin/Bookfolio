/**
 * 책장 장식 소품 — 스프라이트 시트 좌표·스타일 헬퍼.
 *
 * `public/assets/shelf-props.png` 한 장에 여러 타일을 배치하고, 아래 `SHELF_PROP_SPRITE_MAP`의
 * `x`·`y`·`w`·`h`를 실제 시트에 맞게 조정한다. (현재 값은 **그리드 가정용 플레이스홀더**이다.)
 *
 * @history
 * - 2026-05-03: 신규 — 시트 크기·타일 맵·`getShelfPropSpriteStyle`·시드 기반 `pickShelfPropSpriteIds`
 */

/** 시트 원본 픽셀 크기(에셋 교체 시 동기화) */
export const SHELF_PROP_SPRITE_SHEET_PX = { w: 512, h: 512 } as const;

export const SHELF_PROP_SPRITE_SHEET_URL = "/assets/shelf-props.png" as const;

/** 타일 한 칸(가정: 4×4 그리드, 128px). 실제 아틀라스에 맞게 수정 */
const CELL = 128;

export const SHELF_PROP_SPRITE_MAP = {
  plant_small: { x: 0 * CELL, y: 0 * CELL, w: CELL, h: CELL },
  alarm_clock: { x: 1 * CELL, y: 0 * CELL, w: CELL, h: CELL },
  diffuser: { x: 2 * CELL, y: 0 * CELL, w: CELL, h: CELL },
  bubble_candle: { x: 3 * CELL, y: 0 * CELL, w: CELL, h: CELL },
  frame_leaf: { x: 0 * CELL, y: 1 * CELL, w: CELL, h: CELL },
  globe_small: { x: 1 * CELL, y: 1 * CELL, w: CELL, h: CELL },
  bust: { x: 2 * CELL, y: 1 * CELL, w: CELL, h: CELL },
  bear: { x: 3 * CELL, y: 1 * CELL, w: CELL, h: CELL },
  eiffel: { x: 0 * CELL, y: 2 * CELL, w: CELL, h: CELL },
  camera: { x: 1 * CELL, y: 2 * CELL, w: CELL, h: CELL },
  vase_sprig: { x: 2 * CELL, y: 2 * CELL, w: CELL, h: CELL },
  ivy_trail: { x: 3 * CELL, y: 2 * CELL, w: CELL, h: CELL },
  lantern: { x: 0 * CELL, y: 3 * CELL, w: CELL, h: CELL },
  house_ceramic: { x: 1 * CELL, y: 3 * CELL, w: CELL, h: CELL },
  radio_retro: { x: 2 * CELL, y: 3 * CELL, w: CELL, h: CELL },
  lantern_black: { x: 3 * CELL, y: 3 * CELL, w: CELL, h: CELL },
} as const;

export type ShelfPropSpriteId = keyof typeof SHELF_PROP_SPRITE_MAP;

const ORDERED_IDS = Object.keys(SHELF_PROP_SPRITE_MAP) as ShelfPropSpriteId[];

export type ShelfPropSpriteStyle = {
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: "no-repeat";
  width: string;
  height: string;
};

/**
 * 스프라이트 한 타일을 보이게 하는 `style` 객체 (`<span style={…} />` 등).
 */
export function getShelfPropSpriteStyle(
  id: ShelfPropSpriteId,
): ShelfPropSpriteStyle {
  const tile = SHELF_PROP_SPRITE_MAP[id];
  const { w: sw, h: sh } = SHELF_PROP_SPRITE_SHEET_PX;
  return {
    backgroundImage: `url(${SHELF_PROP_SPRITE_SHEET_URL})`,
    backgroundSize: `${sw}px ${sh}px`,
    backgroundPosition: `-${tile.x}px -${tile.y}px`,
    backgroundRepeat: "no-repeat",
    width: `${tile.w}px`,
    height: `${tile.h}px`,
  };
}

function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 같은 `seed`면 항상 동일한 소품 ID 목록(SSR·CSR 일치용). `count`는 1~3 권장.
 */
export function pickShelfPropSpriteIds(
  seed: string,
  count: number,
): ShelfPropSpriteId[] {
  const n = Math.max(0, Math.min(3, Math.floor(count)));
  if (n === 0 || ORDERED_IDS.length === 0) {
    return [];
  }
  const used = new Set<ShelfPropSpriteId>();
  const out: ShelfPropSpriteId[] = [];
  let h = hash32(seed);
  for (let i = 0; i < n; i++) {
    h = Math.imul(h + i + 1, 1103515245) + 12345;
    let idx = h % ORDERED_IDS.length;
    let guard = 0;
    while (used.has(ORDERED_IDS[idx]!) && guard < ORDERED_IDS.length) {
      idx = (idx + 1) % ORDERED_IDS.length;
      guard++;
    }
    const id = ORDERED_IDS[idx]!;
    used.add(id);
    out.push(id);
  }
  return out;
}
