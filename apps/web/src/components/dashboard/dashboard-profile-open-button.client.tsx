"use client";

import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * 대시보드 히어로에서 헤더의 프로필 설정 트리거와 동일한 다이얼로그를 엽니다.
 *
 * @history
 * - 2026-05-03: 신규 — `#site-header-profile-trigger` 클릭 위임
 */
export function DashboardProfileOpenButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-full border-[#1A3C2F]/20 bg-white px-4 text-sm font-medium text-[#1A3C2F] shadow-sm hover:bg-[#1A3C2F]/[0.04]"
      onClick={() =>
        document.getElementById("site-header-profile-trigger")?.click()
      }
    >
      프로필 보기
      <ChevronRight className="ms-1 size-4 opacity-70" aria-hidden />
    </Button>
  );
}
