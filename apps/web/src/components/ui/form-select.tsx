import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * 네이티브 `<select>`. 일부 브라우저 확장이 `data-sharkid` 등 속성을 주입해
 * hydration 불일치 경고가 날 수 있어 `suppressHydrationWarning`을 둔다.
 *
 * @history
 * - 2026-03-26: 확장 프로그램 주입 속성 대응(관리자 권한 `<select>` 등)
 */
function FormSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      suppressHydrationWarning
      data-slot="form-select"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { FormSelect };
