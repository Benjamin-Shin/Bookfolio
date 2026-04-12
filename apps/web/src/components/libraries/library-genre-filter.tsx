import Link from "next/link";

import {
  libraryDetailHref,
  type LibraryBookTab,
} from "@/components/libraries/library-books-list-href";
import { Badge } from "@/components/ui/badge";

type LibraryGenreFilterProps = {
  libraryId: string;
  genres: string[];
  selectedGenre: string;
  selectedOwnerUserId: string;
  /** 필터 변경 시 유지할 탭(페이지는 1로 리셋) */
  tab?: LibraryBookTab;
};

/**
 * 공동서재 상세 장르 슬러그 필터(쿼리 `genre`).
 *
 * @history
 * - 2026-04-12: `tab`·`libraryDetailHref`로 탭 유지
 * - 2026-03-24: `libraryBooksListHref`로 `owner` 쿼리 유지
 * - 2026-03-24: 공동서재 상세 장르 슬러그 필터(쿼리 `genre`)
 */
export function LibraryGenreFilter({
  libraryId,
  genres,
  selectedGenre,
  selectedOwnerUserId,
  tab = "owned",
}: LibraryGenreFilterProps) {
  if (genres.length === 0 && !selectedGenre) {
    return null;
  }

  const owner = selectedOwnerUserId.trim() ? selectedOwnerUserId.trim() : undefined;
  const active = !selectedGenre;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="공동서재 도서 장르 필터"
    >
      <span className="text-xs font-medium text-muted-foreground">장르</span>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant={active ? "default" : "outline"} asChild>
          <Link
            href={libraryDetailHref(libraryId, { genre: undefined, owner, tab, page: 1 })}
            prefetch={false}
          >
            전체
          </Link>
        </Badge>
        {genres.map((slug) => {
          const on = selectedGenre === slug;
          return (
            <Badge key={slug} variant={on ? "default" : "outline"} asChild>
              <Link
                href={libraryDetailHref(libraryId, { genre: slug, owner, tab, page: 1 })}
                prefetch={false}
              >
                {slug}
              </Link>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
