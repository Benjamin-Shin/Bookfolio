"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV: {
  href: Route;
  label: string;
  isActive: (path: string) => boolean;
}[] = [
  {
    href: "/dashboard",
    label: "내 서가",
    isActive: (p) =>
      p === "/dashboard" ||
      (p.startsWith("/dashboard/books") && !p.startsWith("/libraries")),
  },
  {
    href: "/libraries",
    label: "모임서가",
    isActive: (p) => p.startsWith("/libraries"),
  },
  {
    href: "/discovery",
    label: "발견",
    isActive: (p) => p.startsWith("/discovery"),
  },
  {
    href: "/dashboard/bookfolio-aggregate",
    label: "서가담 통계",
    isActive: (p) => p.startsWith("/dashboard/bookfolio-aggregate"),
  },
];

/**
 * 로그인 후 상단 헤더 중앙 내비(시안과 동일한 4메뉴·경로 활성 표시).
 *
 * @history
 * - 2026-05-03: 신규 — 내 서가·발견·모임서가·통계 및 딥 그린 밑줄 활성
 * - 2026-05-03: 발견 루트 `/discovery` 및 하위 경로 활성
 */
export function LoggedInMainNav({ className }: { className?: string }) {
  const pathname = usePathname() || "";

  return (
    <nav
      className={cn("flex items-center gap-1 sm:gap-6", className)}
      aria-label="주요 메뉴"
    >
      {NAV.map(({ href, label, isActive }) => {
        const active = isActive(pathname);
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className={cn(
              "relative pb-3 pt-3 font-sans text-sm font-medium transition-colors",
              active
                ? "text-[#1A3C2F]"
                : "text-[#5c6560] hover:text-[#1A3C2F]/90",
            )}
          >
            {label}
            <span
              className={cn(
                "absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-opacity",
                active
                  ? "bg-[#1A3C2F] opacity-100"
                  : "bg-transparent opacity-0",
              )}
              aria-hidden
            />
          </Link>
        );
      })}
    </nav>
  );
}
