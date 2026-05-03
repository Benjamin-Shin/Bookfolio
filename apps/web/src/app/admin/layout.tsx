/**
 * @history
 * - 2026-05-04: 공지사항 관리(`/admin/announcements`) 내비 링크
 * - 2026-05-03: 관리 내비를 왼쪽 고정(sticky) 사이드바로 두고 본문과 분리
 * - 2026-05-03: 관리 내비에 아이콘·도서 등록(`/admin/books/new`) 링크 추가
 * - 2026-04-10: 클라이언트 오류 수집 관리 링크
 * - 2026-03-29: 모임서가 관리 내비 링크 추가
 * - 2026-03-26: 상단 내비에 포인트·정책 링크 추가
 */
import {
  BookMarked,
  BookOpen,
  BookPlus,
  Bug,
  Coins,
  LayoutDashboard,
  Library,
  Megaphone,
  PenLine,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

import { requireAdmin } from "@/lib/auth/require-admin";

const navLinkClass =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground";

/**
 * 관리자 하위 페이지 공통 셸(권한 확인·좌측 사이드 내비).
 *
 * @history
 * - 2026-05-03: 좌측 sticky 사이드바 + 본문 2열 레이아웃
 * - 2026-05-03: 내비 항목 아이콘 및 도서 등록 링크
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:flex-row md:items-start md:gap-10 md:py-10">
      <aside className="shrink-0 md:sticky md:top-4 md:w-56 md:self-start">
        <nav
          aria-label="관리자 메뉴"
          className="flex flex-col gap-0.5 border-b border-border/60 pb-6 text-sm md:border-b-0 md:border-r md:border-border/60 md:pb-0 md:pr-6"
        >
          <Link href="/admin" className={navLinkClass}>
            <LayoutDashboard className="size-4 shrink-0 opacity-80" aria-hidden />
            관리 홈
          </Link>
          <Link href="/admin/users" className={navLinkClass}>
            <Users className="size-4 shrink-0 opacity-80" aria-hidden />
            사용자 관리
          </Link>
          <Link href="/admin/books" className={navLinkClass}>
            <BookMarked className="size-4 shrink-0 opacity-80" aria-hidden />
            도서 관리
          </Link>
          <Link href={"/admin/books/new" as Route} className={navLinkClass}>
            <BookPlus className="size-4 shrink-0 opacity-80" aria-hidden />
            도서 등록
          </Link>
          <Link href="/admin/points" className={navLinkClass}>
            <Coins className="size-4 shrink-0 opacity-80" aria-hidden />
            포인트 · 정책
          </Link>
          <Link href="/admin/announcements" className={navLinkClass}>
            <Megaphone className="size-4 shrink-0 opacity-80" aria-hidden />
            공지사항
          </Link>
          <Link href="/admin/client-errors" className={navLinkClass}>
            <Bug className="size-4 shrink-0 opacity-80" aria-hidden />
            클라이언트 오류
          </Link>
          <Link
            href={"/admin/shared-libraries" as Route}
            className={navLinkClass}
          >
            <Library className="size-4 shrink-0 opacity-80" aria-hidden />
            모임서가
          </Link>
          <Link href={"/admin/authors" as Route} className={navLinkClass}>
            <PenLine className="size-4 shrink-0 opacity-80" aria-hidden />
            저자 관리
          </Link>
          <div
            className="my-4 border-t border-border/60 md:my-5"
            role="presentation"
          />
          <Link href="/dashboard" className={navLinkClass}>
            <BookOpen className="size-4 shrink-0 opacity-80" aria-hidden />
            내 서가로
          </Link>
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
