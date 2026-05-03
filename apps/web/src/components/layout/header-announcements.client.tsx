"use client";

import type { Route } from "next";
import Link from "next/link";
import { Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type HeaderAnnouncementTeaser = {
  id: string;
  title: string;
};

type HeaderAnnouncementsProps = {
  items: HeaderAnnouncementTeaser[];
};

/**
 * 로그인 헤더 — 공지 미리보기 드롭다운·전체 목록 링크.
 *
 * @history
 * - 2026-05-04: 신규
 */
export function HeaderAnnouncements({ items }: HeaderAnnouncementsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="inline-flex text-[#1A3C2F]"
          aria-label="공지사항"
        >
          <Megaphone className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>공지사항</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">표시 중인 공지가 없습니다.</p>
        ) : (
          items.map((a) => (
            <DropdownMenuItem key={a.id} asChild>
              <Link
                href={`/announcements#${a.id}`}
                className="line-clamp-2 cursor-pointer"
              >
                {a.title}
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={"/announcements" as Route} className="cursor-pointer font-medium">
            전체 공지 보기
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
