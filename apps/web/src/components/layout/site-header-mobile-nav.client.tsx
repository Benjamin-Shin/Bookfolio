"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3Icon,
  BookMarkedIcon,
  CoinsIcon,
  FlameIcon,
  LibraryBigIcon,
  LogInIcon,
  LogOutIcon,
  MenuIcon,
  ShieldIcon,
  SparklesIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";

import { HeaderAccount } from "@/components/layout/header-account";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AppProfileView } from "@/lib/auth/app-profiles";
import { cn } from "@/lib/utils";

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

type SiteHeaderMobileNavProps = {
  apkUrl: string | null;
  user: { id: string; email: string; role?: string | null } | null;
  displayLabel: string;
  initialProfile: AppProfileView | null;
  /** 소유 모임서가에 다른 멤버가 있어 탈퇴가 막히는 서가 이름(서버 `assertAccountDeleteAllowed`와 동일) */
  sharedLibrariesBlockingWithdrawal: string[];
};

function MobileNavLink({
  href,
  className,
  onNavigate,
  children,
}: {
  href: Route;
  className?: string;
  onNavigate: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/**
 * 좁은 화면에서 Sheet로 전역 헤더 내비·법적 고지 링크를 띄웁니다.
 *
 * @history
 * - 2026-04-27: `/login`에서는 비로그인 모바일 메뉴의 로그인 링크를 숨겨 중복 CTA 제거
 * - 2026-04-27: 비로그인 상태 모바일 메뉴에서 `내 서가` 링크를 숨기고 로그인만 노출
 * - 2026-04-13: 계정·데이터 삭제 → `/terms#article-20-withdrawal`
 * - 2026-03-29: 신규 — 햄버거 메뉴·개인정보·약관·쿠키(푸터 동일 경로)
 * - 2026-03-29: `sharedLibrariesBlockingWithdrawal`을 프로필(탈퇴)로 전달
 * - 2026-04-05: 「서가담 집계」 표기
 */
export function SiteHeaderMobileNav({
  apkUrl,
  user,
  displayLabel,
  initialProfile,
  sharedLibrariesBlockingWithdrawal,
}: SiteHeaderMobileNavProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            aria-label="메뉴 열기"
          >
            <MenuIcon className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 border-border/60 p-0 sm:max-w-sm"
        >
          <SheetHeader className="border-b border-border/60 p-4 text-left">
            <SheetTitle className="text-base font-semibold">메뉴</SheetTitle>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-3">
            {apkUrl ? (
              <a
                href={apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <AndroidApkIcon className="size-4 opacity-80" />
                Android 앱(APK)
              </a>
            ) : null}

            {user?.id && user.email ? (
              <>
                <div className="px-2 pb-2 pt-1">
                  <HeaderAccount
                    email={user.email}
                    displayLabel={displayLabel}
                    initialProfile={initialProfile}
                    sharedLibrariesBlockingWithdrawal={
                      sharedLibrariesBlockingWithdrawal
                    }
                  />
                </div>
                <Separator className="my-2" />
                {user.role === "ADMIN" ? (
                  <>
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      관리자
                    </p>
                    <MobileNavLink
                      href="/dashboard/admin/users"
                      onNavigate={close}
                    >
                      <UsersIcon className="size-4 opacity-80" />
                      사용자 관리
                    </MobileNavLink>
                    <MobileNavLink
                      href="/dashboard/admin/books"
                      onNavigate={close}
                    >
                      <BookMarkedIcon className="size-4 opacity-80" />
                      도서 관리
                    </MobileNavLink>
                    <MobileNavLink
                      href="/dashboard/admin/points"
                      onNavigate={close}
                    >
                      <CoinsIcon className="size-4 opacity-80" />
                      포인트 · 정책
                    </MobileNavLink>
                    <MobileNavLink href="/dashboard/admin" onNavigate={close}>
                      <ShieldIcon className="size-4 opacity-80" />
                      관리 홈
                    </MobileNavLink>
                    <Separator className="my-2" />
                  </>
                ) : null}
                <MobileNavLink href="/dashboard/libraries" onNavigate={close}>
                  <UsersRoundIcon className="size-4 opacity-80" />
                  모임서가
                </MobileNavLink>
                <MobileNavLink
                  href="/dashboard/bookfolio-aggregate"
                  onNavigate={close}
                >
                  <BarChart3Icon className="size-4 opacity-80" />
                  서가담 집계
                </MobileNavLink>
                <MobileNavLink href="/dashboard/bestsellers" onNavigate={close}>
                  <FlameIcon className="size-4 opacity-80" />
                  베스트셀러
                </MobileNavLink>
                <MobileNavLink href="/dashboard/choice-new" onNavigate={close}>
                  <SparklesIcon className="size-4 opacity-80" />
                  초이스 신간
                </MobileNavLink>
                <MobileNavLink href="/dashboard" onNavigate={close}>
                  <LibraryBigIcon className="size-4 opacity-90" />내 서가
                </MobileNavLink>
                <form
                  action="/auth/signout"
                  method="post"
                  className="mt-2 px-1"
                >
                  <Button
                    type="submit"
                    variant="ghost"
                    className="h-auto w-full justify-start gap-3 px-3 py-2.5 font-medium text-foreground hover:bg-muted"
                  >
                    <LogOutIcon className="size-4 opacity-80" />
                    로그아웃
                  </Button>
                </form>
              </>
            ) : (
              <>
                {!isLoginPage ? (
                  <MobileNavLink href="/login" onNavigate={close}>
                    <LogInIcon className="size-4 opacity-80" />
                    로그인
                  </MobileNavLink>
                ) : null}
              </>
            )}
          </div>

          <SheetFooter className="mt-auto border-t border-border/60 bg-muted/20">
            <nav
              className="flex w-full flex-col gap-0.5 text-[11px] leading-snug text-muted-foreground"
              aria-label="법적 고지"
            >
              <Link
                href="/privacy"
                onClick={close}
                className="rounded-sm px-1 py-1 hover:text-foreground"
              >
                개인정보처리방침
              </Link>
              <Link
                href="/terms"
                onClick={close}
                className="rounded-sm px-1 py-1 hover:text-foreground"
              >
                서비스 약관
              </Link>
              <Link
                href="/cookies"
                onClick={close}
                className="rounded-sm px-1 py-1 hover:text-foreground"
              >
                쿠키 정책
              </Link>
              <Link
                href={"/terms#article-20-withdrawal" as Route}
                onClick={close}
                className="rounded-sm px-1 py-1 hover:text-foreground"
              >
                계정·데이터 삭제
              </Link>
            </nav>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
