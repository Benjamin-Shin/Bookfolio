"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogInIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * 비로그인 헤더 액션(로그인 CTA).
 *
 * @history
 * - 2026-04-27: `/login` 경로에서는 중복 CTA를 피하기 위해 로그인 버튼 숨김
 */
export function SiteHeaderGuestActions() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return null;
  }

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/login" className="inline-flex items-center gap-2">
        <LogInIcon className="size-4 opacity-80" />
        로그인
      </Link>
    </Button>
  );
}
