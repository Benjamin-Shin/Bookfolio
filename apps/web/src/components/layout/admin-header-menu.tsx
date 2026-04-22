"use client";

/**
 * @history
 * - 2026-04-22: 헤더 관리자 트리거 아이콘을 방패에서 설정(톱니) 아이콘으로 변경
 * - 2026-04-10: 클라이언트 오류 메뉴
 * - 2026-03-26: 포인트·정책 관리 링크 추가
 */
import { BookMarkedIcon, CoinsIcon, SettingsIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function AdminHeaderMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon-sm" className="shrink-0" aria-label="관리자 메뉴">
          <SettingsIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>관리자</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/admin/users" className="flex cursor-pointer items-center gap-2">
            <UsersIcon className="size-4 opacity-70" />
            사용자 관리
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/admin/books" className="flex cursor-pointer items-center gap-2">
            <BookMarkedIcon className="size-4 opacity-70" />
            도서 관리
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/admin/points" className="flex cursor-pointer items-center gap-2">
            <CoinsIcon className="size-4 opacity-70" />
            포인트 · 정책
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/admin/client-errors" className="cursor-pointer">
            클라이언트 오류
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/admin" className="cursor-pointer">
            관리 홈
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
