import Link from "next/link";
import { BookOpen, Bookmark, CheckCircle, Library, Medal } from "lucide-react";

import {
  buildDashboardHref,
  type DashboardOwnedSort,
  type DashboardTab,
} from "@/lib/dashboard/dashboard-href";
import { cn } from "@/lib/utils";

export interface DashboardCollectionTabsProps {
  currentTab: DashboardTab;
  searchQuery: string;
  genreSlug: string;
  ownedSort: DashboardOwnedSort;
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
 * 내 서가 컬렉션(구 좌측 사이드)을 가로 탭으로 표시합니다.
 *
 * @history
 * - 2026-05-03: 신규 — 스티치형 본문 하단(툴바·인사이트 아래) 가로 탭 네비
 * - 2026-05-03: 알약형·악센트 `#1A3C2F` (참고 시안과 통일)
 */
export function DashboardCollectionTabs({
  currentTab,
  searchQuery,
  genreSlug,
  ownedSort,
  counts,
}: DashboardCollectionTabsProps) {
  const q = searchQuery;
  const genre = genreSlug;

  return (
    <nav className="mb-6" aria-label="서가 컬렉션">
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
        <Link
          href={buildDashboardHref({
            q,
            tab: "owned",
            genre: genre || undefined,
            ownedSort: ownedSort === "title" ? "title" : undefined,
          })}
          className={tabBtn(currentTab === "owned")}
          prefetch={false}
        >
          <Library className="size-4 shrink-0 opacity-80" aria-hidden />
          <span>전체 ({counts.owned.toLocaleString("ko-KR")})</span>
        </Link>
        <Link
          href={buildDashboardHref({ q, tab: "reading" })}
          className={tabBtn(currentTab === "reading")}
          prefetch={false}
        >
          <BookOpen className="size-4 shrink-0 opacity-80" aria-hidden />
          <span>읽는 중 ({counts.reading.toLocaleString("ko-KR")})</span>
        </Link>
        <Link
          href={buildDashboardHref({ q, tab: "unread" })}
          className={tabBtn(currentTab === "unread")}
          prefetch={false}
        >
          <Bookmark className="size-4 shrink-0 opacity-80" aria-hidden />
          <span>읽기 전 ({counts.unread.toLocaleString("ko-KR")})</span>
        </Link>
        <Link
          href={buildDashboardHref({ q, tab: "completed" })}
          className={tabBtn(currentTab === "completed")}
          prefetch={false}
        >
          <CheckCircle className="size-4 shrink-0 opacity-80" aria-hidden />
          <span>완료 ({counts.completed.toLocaleString("ko-KR")})</span>
        </Link>
        <Link
          href={buildDashboardHref({ q, tab: "hall" })}
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
