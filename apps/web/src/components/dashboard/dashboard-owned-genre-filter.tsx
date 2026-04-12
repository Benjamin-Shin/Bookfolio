import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  buildDashboardHref,
  type DashboardOwnedSort,
} from "@/lib/dashboard/dashboard-href";

/**
 * @history
 * - 2026-04-12: `ownedSort`로 제목순 쿼리 유지
 * - 2026-03-26: 소장 탭 고정(`tab=owned`)으로 링크
 * - 2026-03-24: 소장 구역 장르 슬러그 필터(링크·쿼리 `genre`)
 */
function ownedDashboardHref(
  q: string,
  genre: string | undefined,
  page: number,
  ownedSort: DashboardOwnedSort,
) {
  return buildDashboardHref({
    q,
    genre,
    page,
    tab: "owned",
    ownedSort: ownedSort === "title" ? "title" : undefined,
  });
}

type DashboardOwnedGenreFilterProps = {
  genres: string[];
  selectedGenre: string;
  searchQuery: string;
  ownedSort: DashboardOwnedSort;
};

export function DashboardOwnedGenreFilter({
  genres,
  selectedGenre,
  searchQuery,
  ownedSort,
}: DashboardOwnedGenreFilterProps) {
  if (genres.length === 0) {
    return null;
  }

  const q = searchQuery;
  const active = !selectedGenre;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="소장 도서 장르 필터"
    >
      <span className="text-xs font-medium text-muted-foreground">장르</span>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant={active ? "default" : "outline"} asChild>
          <Link href={ownedDashboardHref(q, undefined, 1, ownedSort)} prefetch={false}>
            전체
          </Link>
        </Badge>
        {genres.map((slug) => {
          const on = selectedGenre === slug;
          return (
            <Badge key={slug} variant={on ? "default" : "outline"} asChild>
              <Link href={ownedDashboardHref(q, slug, 1, ownedSort)} prefetch={false}>
                {slug}
              </Link>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
