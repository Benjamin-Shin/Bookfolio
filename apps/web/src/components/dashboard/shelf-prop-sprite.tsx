import { cn } from "@/lib/utils";
import {
  getShelfPropSpriteStyle,
  type ShelfPropSpriteId,
} from "@/lib/dashboard/shelf-prop-sprites";

export interface ShelfPropSpriteProps {
  id: ShelfPropSpriteId;
  className?: string;
}

/**
 * 책장 장식용 스프라이트 한 칸(장식 전용, 클릭 없음).
 *
 * @history
 * - 2026-05-03: 신규 — `getShelfPropSpriteStyle` 연동
 */
export function ShelfPropSprite({ id, className }: ShelfPropSpriteProps) {
  return (
    <span
      role="img"
      aria-hidden
      className={cn(
        "pointer-events-none inline-block shrink-0 align-bottom",
        className,
      )}
      style={getShelfPropSpriteStyle(id)}
    />
  );
}
