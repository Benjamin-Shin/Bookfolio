import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface DashboardShelfEmptyStateProps {
  title: string;
  description: ReactNode;
  className?: string;
}

/**
 * 내 서가 빈·무결과 안내 패널(스티치형 카드 톤과 통일).
 *
 * @history
 * - 2026-05-03: 신규 — 점선 테두리·크림 배경 공통화
 */
export function DashboardShelfEmptyState({
  title,
  description,
  className,
}: DashboardShelfEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-[#051b0e]/18 bg-white/60 px-8 py-12 text-center shadow-sm",
        className,
      )}
    >
      <p className="font-serif text-lg text-[#051b0e]">{title}</p>
      <div className="mt-2 text-sm leading-relaxed text-[#434843]">
        {description}
      </div>
    </div>
  );
}
