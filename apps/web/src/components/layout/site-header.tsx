import type { Route } from "next";
import Link from "next/link";
import { Leaf, LogOutIcon, Search } from "lucide-react";

import { auth } from "@/auth";
import { AdminHeaderMenu } from "@/components/layout/admin-header-menu";
import { HeaderAnnouncements } from "@/components/layout/header-announcements.client";
import { HeaderNotifications } from "@/components/layout/header-notifications.client";
import { HeaderAccount } from "@/components/layout/header-account";
import { LoggedInMainNav } from "@/components/layout/logged-in-main-nav.client";
import { SiteHeaderGuestActions } from "@/components/layout/site-header-guest-actions.client";
import { SiteHeaderMobileNav } from "@/components/layout/site-header-mobile-nav.client";
import { Button } from "@/components/ui/button";
import { getAppProfile } from "@/lib/auth/app-profiles";
import { listOwnedSharedLibrariesBlockingWithdrawal } from "@/lib/auth/delete-app-user";
import { env } from "@/lib/env";
import { listPublishedSiteAnnouncements } from "@/lib/site/announcements-repository";
import { countUnreadUserNotifications } from "@/lib/site/user-notifications-repository";
import { cn } from "@/lib/utils";

/**
 * 전역 상단 헤더(브랜드·로그인 시 대시보드 바로가기).
 *
 * @history
 * - 2026-05-04: 비로그인 헤더 `Seogadam_Web_logo2.png` — `h-11`·완화된 `max-w`(과소 `md:8.5rem` 제거)로 표시 확대
 * - 2026-05-04: 공지(`HeaderAnnouncements`·`/announcements`)·개인 알림(`HeaderNotifications`, `user_notifications`)
 * - 2026-05-03: 로그인 레이아웃 — 잎 아이콘·세리프「서가담」·중앙 4메뉴(`LoggedInMainNav`)·검색·알림·계정(시안 정렬)
 * - 2026-05-02: 뷰포트 상단 고정(`fixed`)으로 스크롤 시에도 항상 노출
 * - 2026-04-27: `/login` 경로에서는 비로그인 `로그인` CTA를 숨기도록 클라이언트 경로 분기 추가
 * - 2026-04-27: 비로그인 상태 헤더에서는 `내 서가` CTA를 숨겨 로그인 버튼만 노출
 * - 2026-03-26: 대시보드·로그아웃 등 네비에 lucide 아이콘 추가
 * - 2026-03-28: 네비 순서 — 모임서가 → 북폴리오 집계 → 베스트셀러 → 초이스 신간 → 내 서가
 * - 2026-04-05: 브랜드 서가담·글래스 헤더; 내비 「서가담 집계」 표기
 * - 2026-04-12: 브랜드 링크 — 로그인 시 `/`(랜딩) 대신 `/dashboard`(내 서가)
 * - 2026-04-12: 모바일(`md` 미만) 브랜드 링크·로고 뷰포트 가운데 정렬; PNG 경로 `Seogadam_Web_logo.png`·`alt` 정리
 * - 2026-04-07: 헤더 브랜드 마크·표시명 서가담(`seogadam_logo.png`)
 * - 2026-03-29: `md` 미만 Sheet 햄버거 — 전역 내비·푸터와 동일 법적 고지 링크(개인정보·약관·쿠키)
 * - 2026-03-26: 로그인 네비에 베스트셀러·초이스 신간 링크 추가(이후 `/discovery/*`로 이전)
 * - 2026-03-29: 소유 모임서가(타 멤버 있음) 시 탈퇴 막힘 목록을 헤더·모바일 메뉴에 전달
 */
export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const apkUrl = env.appDownloadUrl;

  const profile = user?.id ? await getAppProfile(user.id) : null;
  const sharedLibrariesBlockingWithdrawal = user?.id
    ? await listOwnedSharedLibrariesBlockingWithdrawal(user.id)
    : [];
  const displayLabel =
    profile?.displayName?.trim() ||
    user?.name?.trim() ||
    user?.email?.trim() ||
    "사용자";

  let announcementTeasers: { id: string; title: string }[] = [];
  let unreadNotifications = 0;
  if (user?.id && user.email) {
    try {
      const published = await listPublishedSiteAnnouncements();
      announcementTeasers = published.map((a) => ({
        id: a.id,
        title: a.title,
      }));
      unreadNotifications = await countUnreadUserNotifications(user.id);
    } catch {
      announcementTeasers = [];
      unreadNotifications = 0;
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#1A3C2F]/10 bg-[#F8F9FA]/95 backdrop-blur-md">
      <div
        className={cn(
          "mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-3 sm:px-4 md:gap-4 md:px-6",
          !(user?.id && user.email) && "justify-end",
        )}
      >
        {user?.id && user.email ? (
          <>
            <div className="flex min-w-0 shrink-0 items-center gap-2 md:gap-3">
              <SiteHeaderMobileNav
                apkUrl={apkUrl ?? null}
                user={
                  user.id && user.email
                    ? {
                        id: user.id,
                        email: user.email,
                        role: user.role ?? null,
                      }
                    : null
                }
                displayLabel={displayLabel}
                initialProfile={profile}
                sharedLibrariesBlockingWithdrawal={
                  sharedLibrariesBlockingWithdrawal
                }
              />
              <Link
                href={"/dashboard" as Route}
                className="flex min-w-0 items-center gap-2 text-[#1A3C2F]"
              >
                <Leaf
                  className="size-7 shrink-0 text-[#1A3C2F] md:size-8"
                  aria-hidden
                />
                <span className="font-serif text-lg font-semibold tracking-tight md:text-xl">
                  서가담
                </span>
              </Link>
              {user.role === "ADMIN" ? (
                <span className="hidden sm:inline-block">
                  <AdminHeaderMenu />
                </span>
              ) : null}
            </div>

            <LoggedInMainNav className="mx-auto hidden min-w-0 flex-1 justify-center md:flex" />

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="hidden text-[#1A3C2F] sm:inline-flex"
                asChild
              >
                <Link
                  href={"/dashboard?tab=owned" as Route}
                  aria-label="내 서가에서 검색"
                >
                  <Search className="size-5" />
                </Link>
              </Button>
              <HeaderAnnouncements items={announcementTeasers} />
              <HeaderNotifications initialUnreadCount={unreadNotifications} />
              <HeaderAccount
                email={user.email}
                displayLabel={displayLabel}
                initialProfile={profile}
                sharedLibrariesBlockingWithdrawal={
                  sharedLibrariesBlockingWithdrawal
                }
              />
              <form action="/auth/signout" method="post" className="shrink-0">
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="text-[#5c6560] hover:text-[#1A3C2F]"
                  aria-label="로그아웃"
                >
                  <LogOutIcon className="size-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="relative flex w-full items-center justify-end gap-4 md:justify-between">
            <Link
              href="/"
              className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center md:static md:left-auto md:top-auto md:z-auto md:translate-x-0 md:translate-y-0"
            >
              <img
                src="/assets/Seogadam_Web_logo2.png"
                alt="서가담"
                width={313}
                height={60}
                className="h-11 w-auto max-h-11 max-w-[min(16rem,calc(100vw-5.5rem))] shrink-0 object-contain object-left md:max-w-[min(20rem,calc(100vw-12rem))]"
              />
            </Link>
            <nav className="flex min-w-0 items-center gap-2">
              <div className="hidden min-w-0 items-center gap-2 md:flex">
                <SiteHeaderGuestActions />
              </div>
              <SiteHeaderMobileNav
                apkUrl={apkUrl ?? null}
                user={null}
                displayLabel={displayLabel}
                initialProfile={profile}
                sharedLibrariesBlockingWithdrawal={
                  sharedLibrariesBlockingWithdrawal
                }
              />
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
