import Link from "next/link";

import { Badge } from "@/components/ui/badge";

import {
  libraryDetailHref,
  type LibraryBookTab,
} from "@/components/libraries/library-books-list-href";

type OwnerOption = {
  userId: string;
  label: string;
};

type LibraryOwnerFilterProps = {
  libraryId: string;
  owners: OwnerOption[];
  selectedOwnerUserId: string;
  selectedGenre: string;
  tab?: LibraryBookTab;
};

/**
 * 모임서가 상세 소유자(멤버) 필터 — `owner` 쿼리는 `userId`.
 *
 * @history
 * - 2026-04-12: `tab`·`libraryDetailHref`로 탭 유지
 * - 2026-03-24: 신규
 */
export function LibraryOwnerFilter({
  libraryId,
  owners,
  selectedOwnerUserId,
  selectedGenre,
  tab = "owned",
}: LibraryOwnerFilterProps) {
  if (owners.length === 0 && !selectedOwnerUserId) {
    return null;
  }

  const genre = selectedGenre.trim() ? selectedGenre.trim() : undefined;
  const active = !selectedOwnerUserId.trim();

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="모임서가 도서 소유자 필터"
    >
      <span className="text-xs font-medium text-muted-foreground">소유자</span>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant={active ? "default" : "outline"} asChild>
          <Link
            href={libraryDetailHref(libraryId, {
              genre,
              owner: undefined,
              tab,
              page: 1,
            })}
            prefetch={false}
          >
            전체
          </Link>
        </Badge>
        {owners.map((o) => {
          const on = selectedOwnerUserId === o.userId;
          return (
            <Badge
              key={o.userId}
              variant={on ? "default" : "outline"}
              className="max-w-[12rem] truncate font-normal"
              asChild
            >
              <Link
                href={libraryDetailHref(libraryId, {
                  genre,
                  owner: o.userId,
                  tab,
                  page: 1,
                })}
                prefetch={false}
                title={o.label}
              >
                {o.label}
              </Link>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
