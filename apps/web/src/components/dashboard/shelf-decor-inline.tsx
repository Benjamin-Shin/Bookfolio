import type { DecorKind } from "@/lib/dashboard/shelf-row-mix";
import { DECOR_KIND_IMAGE_URL } from "@/lib/dashboard/shelf-row-mix";

export interface ShelfDecorInlineProps {
  kind: DecorKind;
}

/**
 * 책 줄 사이 데코 — `public/assets/shelf-decor/{kind}.svg`(또는 동명 PNG) 개별 파일.
 *
 * @history
 * - 2026-05-03: `<img>` + `DECOR_KIND_IMAGE_URL`로 전환(스프라이트 시트 미배치 시 빈 칸 방지)
 * - 2026-05-03: 시트 미배치 시에도 슬롯이 보이도록 연한 배경·링
 * - 2026-05-03: Editorial 벽 `#f0f0f0`에 맞춰 슬롯을 중립 회색 톤으로
 * - 2026-05-03: 신규 — 참고 `DecorItem` 마크업
 */
export function ShelfDecorInline({ kind }: ShelfDecorInlineProps) {
  const src = DECOR_KIND_IMAGE_URL[kind];
  return (
    <div className="relative flex h-[80px] w-[70px] shrink-0 items-end justify-center rounded-md bg-black/[0.035] ring-1 ring-black/[0.06]">
      <img
        src={src}
        alt=""
        className="max-h-[72px] w-auto max-w-[64px] object-contain drop-shadow-md"
        loading="lazy"
        decoding="async"
      />
      <div
        className="pointer-events-none absolute bottom-[-6px] left-1/2 h-[8px] w-[60%] -translate-x-1/2 bg-black/20 blur-md"
        aria-hidden
      />
    </div>
  );
}
