"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * @history
 * - 2026-05-02: 고정 헤더·푸터와 겹치지 않도록 본문 래퍼에 `pt-14`·`pb-32`·스크롤(`min-h-0`) 적용
 * - 2026-03-26: 전역 푸터용 세로 flex 래퍼
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex min-h-dvh flex-col">
        {children}
      </div>
    </SessionProvider>
  );
}
