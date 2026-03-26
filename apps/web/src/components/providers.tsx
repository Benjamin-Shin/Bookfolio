"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * @history
 * - 2026-03-26: 전역 푸터용 세로 flex 래퍼
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen flex-col">{children}</div>
    </SessionProvider>
  );
}
