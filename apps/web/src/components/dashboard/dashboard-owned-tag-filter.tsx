import Link from "next/link";

import { USER_BOOK_TAG_UNTAGGED_FILTER } from "@bookfolio/shared";

import { Badge } from "@/components/ui/badge";
import {
  buildDashboardHref,
  type DashboardOwnedSort,
} from "@/lib/dashboard/dashboard-href";

/**
 * @history
 * - 2026-05-24: `user_books.tags` 필터 — 내 서가 정리용(장르와 별도)
 */
function ownedDashboardHref(
  q: string,
  genre: string | undefined,
  tag: string | undefined,
  page: number,
  ownedSort: DashboardOwnedSort,
) {
  return buildDashboardHref({
    q,
    genre,
    tag,
    page,
    tab: "owned",
    ownedSort: ownedSort === "title" ? "title" : undefined,
  });
}

type DashboardOwnedTagFilterProps = {
  tags: string[];
  selectedTag: string;
  searchQuery: string;
  genreSlug: string;
  ownedSort: DashboardOwnedSort;
  untaggedCount?: number;
};

export function DashboardOwnedTagFilter({
  tags,
  selectedTag,
  searchQuery,
  genreSlug,
  ownedSort,
  untaggedCount = 0,
}: DashboardOwnedTagFilterProps) {
  if (tags.length === 0 && untaggedCount <= 0) {
    return null;
  }

  const q = searchQuery;
  const genre = genreSlug.trim() || undefined;
  const activeAll = !selectedTag;

  return (
    <div
      className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1"
      aria-label="내 태그 필터"
    >
      <span className="shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-[#434843]">
        내 태그
      </span>
      <div className="flex min-w-0 flex-wrap gap-1.5">
        <Badge variant={activeAll ? "default" : "outline"} asChild>
          <Link
            href={ownedDashboardHref(q, genre, undefined, 1, ownedSort)}
            prefetch={false}
          >
            전체
          </Link>
        </Badge>
        {untaggedCount > 0 ? (
          <Badge
            variant={
              selectedTag === USER_BOOK_TAG_UNTAGGED_FILTER
                ? "default"
                : "outline"
            }
            asChild
          >
            <Link
              href={ownedDashboardHref(
                q,
                genre,
                USER_BOOK_TAG_UNTAGGED_FILTER,
                1,
                ownedSort,
              )}
              prefetch={false}
            >
              미분류 ({untaggedCount.toLocaleString("ko-KR")})
            </Link>
          </Badge>
        ) : null}
        {tags.map((tag) => {
          const on = selectedTag === tag;
          return (
            <Badge key={tag} variant={on ? "default" : "outline"} asChild>
              <Link
                href={ownedDashboardHref(q, genre, tag, 1, ownedSort)}
                prefetch={false}
              >
                {tag}
              </Link>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
