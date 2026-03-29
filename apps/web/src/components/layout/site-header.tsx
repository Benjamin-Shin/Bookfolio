import type { Route } from "next";
import Link from "next/link";
import {
  BarChart3Icon,
  FlameIcon,
  LibraryBigIcon,
  LogInIcon,
  LogOutIcon,
  SparklesIcon,
  UsersRoundIcon,
} from "lucide-react";

import { auth } from "@/auth";
import { AdminHeaderMenu } from "@/components/layout/admin-header-menu";
import { HeaderAccount } from "@/components/layout/header-account";
import { SiteHeaderMobileNav } from "@/components/layout/site-header-mobile-nav.client";
import { Button } from "@/components/ui/button";
import { getAppProfile } from "@/lib/auth/app-profiles";
import { env } from "@/lib/env";

function AndroidApkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.55 1.22 12.85 1 12 1s-1.55.22-2.2.63L8.32.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3C6.97 3.97 6 6.24 6 8.83V9h12v-.17c0-2.59-.97-4.86-2.47-6.67z" />
    </svg>
  );
}

/**
 * 전역 상단 헤더(브랜드·로그인 시 대시보드 바로가기).
 *
 * @history
 * - 2026-03-26: 대시보드·로그아웃 등 네비에 lucide 아이콘 추가
 * - 2026-03-28: 네비 순서 — 공동서재 → 북폴리오 집계 → 베스트셀러 → 초이스 신간 → 내 서재
 * - 2026-03-29: `md` 미만 Sheet 햄버거 — 전역 내비·푸터와 동일 법적 고지 링크(개인정보·약관·쿠키)
 * - 2026-03-26: 로그인 네비에 베스트셀러·초이스 신간 링크 추가(`dashboard/bestsellers`, `dashboard/choice-new`)
 */
export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const apkUrl = env.appDownloadUrl;

  const profile = user?.id ? await getAppProfile(user.id) : null;
  const displayLabel =
    profile?.displayName?.trim() ||
    user?.name?.trim() ||
    user?.email?.trim() ||
    "사용자";

  return (
    <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
        >
          <img
            src="/assets/bookfolio_b_favicon.svg"
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0"
          />
          Bookfolio
        </Link>
        <nav className="flex min-w-0 items-center gap-2">
          <div className="hidden min-w-0 items-center gap-2 md:flex">
            {apkUrl ? (
              <Button variant="ghost" size="icon-sm" className="shrink-0" asChild>
                <a
                  href={apkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Android 앱(APK) 다운로드"
                  title="Android 앱(APK) 다운로드"
                >
                  <AndroidApkIcon className="size-4" />
                </a>
              </Button>
            ) : null}
            {user?.id && user.email ? (
              <>
                {user.role === "ADMIN" ? <AdminHeaderMenu /> : null}
                <HeaderAccount
                  email={user.email}
                  displayLabel={displayLabel}
                  initialProfile={profile}
                />
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={"/dashboard/libraries" as Route}
                    className="inline-flex items-center gap-2"
                  >
                    <UsersRoundIcon className="size-4 opacity-80" />
                    공동서재
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={"/dashboard/bookfolio-aggregate" as Route}
                    className="inline-flex items-center gap-2"
                  >
                    <BarChart3Icon className="size-4 opacity-80" />
                    북폴리오 집계
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={"/dashboard/bestsellers" as Route}
                    className="inline-flex items-center gap-2"
                  >
                    <FlameIcon className="size-4 opacity-80" />
                    베스트셀러
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={"/dashboard/choice-new" as Route}
                    className="inline-flex items-center gap-2"
                  >
                    <SparklesIcon className="size-4 opacity-80" />
                    초이스 신간
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2"
                  >
                    <LibraryBigIcon className="size-4 opacity-90" />내 서재
                  </Link>
                </Button>
                <form action="/auth/signout" method="post">
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="inline-flex items-center gap-2"
                  >
                    <LogOutIcon className="size-4 opacity-80" />
                    로그아웃
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login" className="inline-flex items-center gap-2">
                    <LogInIcon className="size-4 opacity-80" />
                    로그인
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2"
                  >
                    <LibraryBigIcon className="size-4 opacity-90" />내 서재
                  </Link>
                </Button>
              </>
            )}
          </div>
          <SiteHeaderMobileNav
            apkUrl={apkUrl ?? null}
            user={
              user?.id && user.email
                ? { id: user.id, email: user.email, role: user.role ?? null }
                : null
            }
            displayLabel={displayLabel}
            initialProfile={profile}
          />
        </nav>
      </div>
    </header>
  );
}
