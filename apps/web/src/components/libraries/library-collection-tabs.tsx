import type { Route } from "next";
import Link from "next/link";
import { BookOpen, Bookmark, CheckCircle, Library, Medal } from "lucide-react";

import {
  libraryDetailHref,
  type LibraryBookTab,
} from "@/components/libraries/library-books-list-href";
import { cn } from "@/lib/utils";

export interface LibraryCollectionTabsProps {
  libraryId: string;
  currentTab: LibraryBookTab;
  genreSlug: string;
  ownerUserId: string;
  counts: {
    owned: number;
    reading: number;
    unread: number;
    completed: number;
    hall: number;
  };
}

const tabBtn = (active: boolean) =>
  cn(
    "flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 font-sans text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:text-sm",
    active
      ? "border-[#1A3C2F] bg-[#1A3C2F] text-white shadow-sm"
      : "border-[#1A3C2F]/15 bg-white text-[#5c6560] hover:border-[#1A3C2F]/30 hover:text-[#1A3C2F]",
  );

/**
 * 모임서가 상세 — 내 서가와 동일 패턴의 가로 컬렉션 탭.
 *
 * @history
 * - 2026-05-04: 신규 — 좌측 사이드 제거 후 본문 탭 네비
 */
export function LibraryCollectionTabs({
  libraryId,
  currentTab,
  genreSlug,
  ownerUserId,
  counts,
}: LibraryCollectionTabsProps) {
  const genre = genreSlug.trim();
  const owner = ownerUserId.trim();

  const href = (tab: LibraryBookTab) =>
    libraryDetailHref(libraryId, {
      tab: tab === "owned" ? undefined : tab,
      genre: genre || undefined,
      owner: owner || undefined,
    });

  return (
    <nav className="mb-6" aria-label="모임서가 컬렉션">
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
        <Link
          href={href("owned") as Route}
          className={tabBtn(currentTab === "owned")}
          prefetch={false}
        >
          <Library className="size-4 shrink-0 opacity-80" aria-hidden />
          <span>전체 ({counts.owned.toLocaleString("ko-KR")})</span>
        </Link>
        <Link
          href={href("reading") as Route}
          className={tabBtn(currentTab === "reading")}
          prefetch={false}
        >
          <BookOpen className="size-4 shrink-0 opacity-80" aria-hidden />
          <span>읽는 중 ({counts.reading.toLocaleString("ko-KR")})</span>
        </Link>
        <Link
          href={href("unread") as Route}
          className={tabBtn(currentTab === "unread")}
          prefetch={false}
        >
          <Bookmark className="size-4 shrink-0 opacity-80" aria-hidden />
          <span>읽기 전 ({counts.unread.toLocaleString("ko-KR")})</span>
        </Link>
        <Link
          href={href("completed") as Route}
          className={tabBtn(currentTab === "completed")}
          prefetch={false}
        >
          <CheckCircle className="size-4 shrink-0 opacity-80" aria-hidden />
          <span>완료 ({counts.completed.toLocaleString("ko-KR")})</span>
        </Link>
        <Link
          href={href("hall") as Route}
          className={tabBtn(currentTab === "hall")}
          prefetch={false}
        >
          <Medal className="size-4 shrink-0 opacity-80" aria-hidden />
          <span>명예의 전당 ({counts.hall.toLocaleString("ko-KR")})</span>
        </Link>
      </div>
    </nav>
  );
}
