import type { Route } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";

/**
 * @history
 * - 2026-03-24: 소장 구역 장르 슬러그 필터(링크·쿼리 `genre`)
 */
function dashboardHref(q: string, genre: string | undefined, page: number): Route {
  const sp = new URLSearchParams();
  if (q.trim()) sp.set("q", q.trim());
  if (genre?.trim()) sp.set("genre", genre.trim());
  if (page > 1) sp.set("page", String(page));
  const s = sp.toString();
  return (s ? `/dashboard?${s}` : "/dashboard") as Route;
}

type DashboardOwnedGenreFilterProps = {
  genres: string[];
  selectedGenre: string;
  searchQuery: string;
};

export function DashboardOwnedGenreFilter({
  genres,
  selectedGenre,
  searchQuery
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
          <Link href={dashboardHref(q, undefined, 1)} prefetch={false}>
            전체
          </Link>
        </Badge>
        {genres.map((slug) => {
          const on = selectedGenre === slug;
          return (
            <Badge key={slug} variant={on ? "default" : "outline"} asChild>
              <Link href={dashboardHref(q, slug, 1)} prefetch={false}>
                {slug}
              </Link>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
