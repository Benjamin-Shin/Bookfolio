import type { LibraryAggregatedBookRow, LibraryMemberRow } from "@bookfolio/shared";
import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { LibraryBookshelf } from "@/components/books/library-bookshelf";
import { DeleteLibraryButton } from "@/components/libraries/delete-library-button";
import { LibraryGenreFilter } from "@/components/libraries/library-genre-filter";
import { LibraryMembersPanel } from "@/components/libraries/library-members-panel";
import { LibraryOwnerFilter } from "@/components/libraries/library-owner-filter";
import { LIBRARY_KIND_LABELS } from "@/components/libraries/reading-status-labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLibrary, listLibraryBooks, listLibraryMembers } from "@/lib/libraries/repository";

type PageProps = {
  params: Promise<{ libraryId: string }>;
  searchParams: Promise<{ genre?: string; owner?: string }>;
};

function collectUniqueGenreSlugs(books: LibraryAggregatedBookRow[]): string[] {
  const set = new Set<string>();
  for (const b of books) {
    for (const g of b.genreSlugs ?? []) {
      const t = g.trim();
      if (t) set.add(t);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "ko"));
}

function filterLibraryBooksByGenre(
  books: LibraryAggregatedBookRow[],
  genreSlug: string
): LibraryAggregatedBookRow[] {
  const g = genreSlug.trim();
  if (!g) return books;
  return books.filter((b) => (b.genreSlugs ?? []).includes(g));
}

function filterLibraryBooksByOwnerUserId(
  books: LibraryAggregatedBookRow[],
  ownerUserId: string
): LibraryAggregatedBookRow[] {
  const id = ownerUserId.trim();
  if (!id) return books;
  return books.filter((b) => b.owners.some((o) => o.userId === id));
}

function membersToOwnerFilterOptions(
  members: LibraryMemberRow[]
): { userId: string; label: string }[] {
  return [...members]
    .map((m) => ({
      userId: m.userId,
      label: m.name?.trim() || m.email || "이름 없음"
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));
}

function emptyLibraryBooksFilterMessage(genreFilter: string, ownerFilter: string): string {
  const g = genreFilter.length > 0;
  const o = ownerFilter.length > 0;
  if (g && o) return "선택한 장르·소유자 조건에 맞는 책이 없습니다.";
  if (g) return "선택한 장르에 해당하는 책이 없습니다.";
  if (o) return "선택한 소유자가 올린 책이 없습니다.";
  return "선택한 조건에 맞는 책이 없습니다.";
}

/**
 * 공동서재 상세(멤버·책).
 *
 * @history
 * - 2026-03-24: `LibraryBookshelf` import를 `library-bookshelf.tsx`(클라이언트)로 변경 — 하이드레이션 경고 완화
 * - 2026-03-24: 소유자 필터(`owner`=`userId`)·장르와 쿼리 상호 유지
 * - 2026-03-24: 책 `genre` 쿼리 필터·총·표시 권수·`LibraryGenreFilter`
 * - 2026-03-24: 책 목록을 `LibraryBookshelf` 선반 UI로 표시
 */
export default async function LibraryDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { libraryId } = await params;
  const sp = await searchParams;
  const genreFilter = (sp.genre ?? "").trim();
  const ownerFilter = (sp.owner ?? "").trim();
  const ctx = { userId: session.user.id, useAdmin: true } as const;

  const lib = await getLibrary(libraryId, session.user.id, ctx);
  if (!lib) {
    notFound();
  }

  const [members, books] = await Promise.all([
    listLibraryMembers(libraryId, session.user.id, ctx),
    listLibraryBooks(libraryId, session.user.id, ctx)
  ]);

  const libraryGenreSlugs = collectUniqueGenreSlugs(books);
  const ownerFilterOptions = membersToOwnerFilterOptions(members);
  let filteredBooks = filterLibraryBooksByGenre(books, genreFilter);
  filteredBooks = filterLibraryBooksByOwnerUserId(filteredBooks, ownerFilter);

  const hasActiveBookFilter = genreFilter.length > 0 || ownerFilter.length > 0;
  const showOwnerFilter = books.length > 0 && (members.length > 1 || ownerFilter.length > 0);

  const isOwner = lib.myRole === "owner";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {LIBRARY_KIND_LABELS[lib.kind]}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{lib.name}</h1>
          {lib.description ? <p className="mt-1 text-sm text-muted-foreground">{lib.description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={"/dashboard/libraries" as Route}>목록</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/libraries/${libraryId}/books/new` as Route}>책 추가</Link>
          </Button>
          {isOwner ? <DeleteLibraryButton libraryId={libraryId} /> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">멤버</CardTitle>
            <CardDescription>소유자만 이메일로 멤버를 추가할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <LibraryMembersPanel
              libraryId={libraryId}
              initialMembers={members}
              currentUserId={session.user.id}
              isOwner={isOwner}
            />
          </CardContent>
        </Card>

        <Card className="border-border/80 lg:col-span-2">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <CardTitle className="text-lg">책</CardTitle>
                  {books.length > 0 ? (
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {hasActiveBookFilter
                        ? `전체 ${books.length}권 · 표시 ${filteredBooks.length}권`
                        : `총 ${books.length}권`}
                    </span>
                  ) : null}
                </div>
                <CardDescription>
                  서재를 만든 분의 개인 서재 책은 서재 생성 시 자동으로 여기에 올라옵니다. 멤버는「책 추가」로 자신의 책만
                  올릴 수 있고, 같은 책은 한 줄로 묶여 소유자 이름이 표시됩니다.
                </CardDescription>
              </div>
            </div>
            {books.length > 0 ? (
              <div className="flex flex-col gap-3">
                <LibraryGenreFilter
                  libraryId={libraryId}
                  genres={libraryGenreSlugs}
                  selectedGenre={genreFilter}
                  selectedOwnerUserId={ownerFilter}
                />
                {showOwnerFilter ? (
                  <LibraryOwnerFilter
                    libraryId={libraryId}
                    owners={ownerFilterOptions}
                    selectedOwnerUserId={ownerFilter}
                    selectedGenre={genreFilter}
                  />
                ) : null}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {books.length === 0 ? (
              <p className="text-sm text-muted-foreground">아직 책이 없습니다.</p>
            ) : filteredBooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {emptyLibraryBooksFilterMessage(genreFilter, ownerFilter)}
              </p>
            ) : (
              <LibraryBookshelf libraryId={libraryId} books={filteredBooks} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
