import type {
  LibraryAggregatedBookRow,
  LibraryMemberRow,
} from "@bookfolio/shared";
import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookOpen, Bookmark, CheckCircle, Library, Medal } from "lucide-react";

import { BOOKS_PER_SHELF } from "@/components/books/bookshelf-shared";
import { LibraryBookshelf } from "@/components/books/library-bookshelf";
import {
  libraryDetailHref,
  parseLibraryBookTab,
  type LibraryBookTab,
} from "@/components/libraries/library-books-list-href";
import { LibraryBooksPagination } from "@/components/libraries/library-books-pagination";
import { DeleteLibraryButton } from "@/components/libraries/delete-library-button";
import { LibraryGenreFilter } from "@/components/libraries/library-genre-filter";
import { LibraryMembersSidebar } from "@/components/libraries/library-members-sidebar.client";
import { LibraryOwnerFilter } from "@/components/libraries/library-owner-filter";
import { LIBRARY_KIND_LABELS } from "@/components/libraries/reading-status-labels";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import {
  getLibrary,
  listLibraryBooks,
  listLibraryMembers,
} from "@/lib/libraries/repository";

const PAGE_SIZE = BOOKS_PER_SHELF;
const READING_SHELF_LIMIT = 50;

type PageProps = {
  params: Promise<{ libraryId: string }>;
  searchParams: Promise<{
    genre?: string;
    owner?: string;
    tab?: string;
    page?: string;
  }>;
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
  genreSlug: string,
): LibraryAggregatedBookRow[] {
  const g = genreSlug.trim();
  if (!g) return books;
  return books.filter((b) => (b.genreSlugs ?? []).includes(g));
}

function filterLibraryBooksByOwnerUserId(
  books: LibraryAggregatedBookRow[],
  ownerUserId: string,
): LibraryAggregatedBookRow[] {
  const id = ownerUserId.trim();
  if (!id) return books;
  return books.filter((b) => b.owners.some((o) => o.userId === id));
}

function membersToOwnerFilterOptions(
  members: LibraryMemberRow[],
): { userId: string; label: string }[] {
  return [...members]
    .map((m) => ({
      userId: m.userId,
      label: m.name?.trim() || "이름 없음",
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));
}

function emptyLibraryBooksFilterMessage(
  genreFilter: string,
  ownerFilter: string,
): string {
  const g = genreFilter.length > 0;
  const o = ownerFilter.length > 0;
  if (g && o) return "선택한 장르·소유자 조건에 맞는 책이 없습니다.";
  if (g) return "선택한 장르에 해당하는 책이 없습니다.";
  if (o) return "선택한 소유자가 올린 책이 없습니다.";
  return "선택한 조건에 맞는 책이 없습니다.";
}

function ownerHallOfFame(
  o: LibraryAggregatedBookRow["owners"][number],
): boolean {
  return o.readingStatus === "completed" && o.rating != null && o.rating >= 4;
}

function bookMatchesTab(
  book: LibraryAggregatedBookRow,
  tab: LibraryBookTab,
): boolean {
  const { owners } = book;
  switch (tab) {
    case "owned":
      return true;
    case "reading":
      return owners.some((o) => o.readingStatus === "reading");
    case "unread":
      return owners.some((o) => o.readingStatus === "unread");
    case "completed":
      return owners.some((o) => o.readingStatus === "completed");
    case "hall":
      return owners.some(ownerHallOfFame);
    default:
      return true;
  }
}

function tabSectionLabel(tab: LibraryBookTab): string {
  switch (tab) {
    case "owned":
      return "전체 소장";
    case "reading":
      return "읽는 중";
    case "unread":
      return "읽기 전";
    case "completed":
      return "완독";
    case "hall":
      return "Hall of Fame";
    default:
      return "도서";
  }
}

/**
 * 모임서가 상세(멤버·책) — 내 서가형 좌측 컬렉션·멤버 패널.
 *
 * @history
 * - 2026-04-12: 에디토리얼 좌측 메뉴(집계 탭·Hall of Fame)·멤버·초대 다이얼로그; `tab`·`page`·`owners.rating`
 * - 2026-03-24: `LibraryBookshelf` import를 `library-bookshelf.tsx`(클라이언트)로 변경 — 하이드레이션 경고 완화
 * - 2026-03-24: 소유자 필터(`owner`=`userId`)·장르와 쿼리 상호 유지
 * - 2026-03-24: 책 `genre` 쿼리 필터·총·표시 권수·`LibraryGenreFilter`
 * - 2026-03-24: 책 목록을 `LibraryBookshelf` 선반 UI로 표시
 */
export default async function LibraryDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { libraryId } = await params;
  const sp = await searchParams;
  const genreFilter = (sp.genre ?? "").trim();
  const ownerFilter = (sp.owner ?? "").trim();
  const tab = parseLibraryBookTab(sp.tab);
  const pageRaw = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const ctx = { userId: session.user.id, useAdmin: true } as const;

  const lib = await getLibrary(libraryId, session.user.id, ctx);
  if (!lib) {
    notFound();
  }

  const [members, books] = await Promise.all([
    listLibraryMembers(libraryId, session.user.id, ctx),
    listLibraryBooks(libraryId, session.user.id, ctx),
  ]);

  const ownedTotalAll = books.length;
  const readingBooksAll = books.filter((b) => bookMatchesTab(b, "reading"));
  const unreadBooksAll = books.filter((b) => bookMatchesTab(b, "unread"));
  const completedBooksAll = books.filter((b) => bookMatchesTab(b, "completed"));
  const hallBooksAll = books.filter((b) => bookMatchesTab(b, "hall"));

  const readingTotal = readingBooksAll.length;
  const unreadTotal = unreadBooksAll.length;
  const completedTotal = completedBooksAll.length;
  const hallTotal = hallBooksAll.length;

  if (tab === "reading" && pageRaw > 1) {
    redirect(
      libraryDetailHref(libraryId, {
        tab: "reading",
        genre: genreFilter || undefined,
        owner: ownerFilter || undefined,
      }),
    );
  }

  const unreadTotalPages = Math.max(1, Math.ceil(unreadTotal / PAGE_SIZE));
  const completedTotalPages = Math.max(
    1,
    Math.ceil(completedTotal / PAGE_SIZE),
  );
  const hallTotalPages = Math.max(1, Math.ceil(hallTotal / PAGE_SIZE));
  const ownedTotalPages = Math.max(1, Math.ceil(ownedTotalAll / PAGE_SIZE));

  const unreadPage =
    unreadTotal === 0 ? 1 : Math.min(pageRaw, unreadTotalPages);
  const completedPage =
    completedTotal === 0 ? 1 : Math.min(pageRaw, completedTotalPages);
  const hallPage = hallTotal === 0 ? 1 : Math.min(pageRaw, hallTotalPages);
  const ownedPage =
    ownedTotalAll === 0 ? 1 : Math.min(pageRaw, ownedTotalPages);

  if (tab === "unread" && unreadTotal > 0 && pageRaw > unreadTotalPages) {
    redirect(
      libraryDetailHref(libraryId, {
        tab: "unread",
        genre: genreFilter || undefined,
        owner: ownerFilter || undefined,
        page: unreadTotalPages,
      }),
    );
  }
  if (
    tab === "completed" &&
    completedTotal > 0 &&
    pageRaw > completedTotalPages
  ) {
    redirect(
      libraryDetailHref(libraryId, {
        tab: "completed",
        genre: genreFilter || undefined,
        owner: ownerFilter || undefined,
        page: completedTotalPages,
      }),
    );
  }
  if (tab === "hall" && hallTotal > 0 && pageRaw > hallTotalPages) {
    redirect(
      libraryDetailHref(libraryId, {
        tab: "hall",
        genre: genreFilter || undefined,
        owner: ownerFilter || undefined,
        page: hallTotalPages,
      }),
    );
  }
  if (tab === "owned" && ownedTotalAll > 0 && pageRaw > ownedTotalPages) {
    redirect(
      libraryDetailHref(libraryId, {
        tab: "owned",
        genre: genreFilter || undefined,
        owner: ownerFilter || undefined,
        page: ownedTotalPages,
      }),
    );
  }

  const libraryGenreSlugs = collectUniqueGenreSlugs(books);
  const ownerFilterOptions = membersToOwnerFilterOptions(members);

  const tabSource =
    tab === "owned"
      ? books
      : tab === "reading"
        ? readingBooksAll
        : tab === "unread"
          ? unreadBooksAll
          : tab === "completed"
            ? completedBooksAll
            : hallBooksAll;

  let filteredBooks = filterLibraryBooksByGenre(tabSource, genreFilter);
  filteredBooks = filterLibraryBooksByOwnerUserId(filteredBooks, ownerFilter);

  const hasActiveBookFilter = genreFilter.length > 0 || ownerFilter.length > 0;
  const showOwnerFilter =
    books.length > 0 && (members.length > 1 || ownerFilter.length > 0);

  let pagedBooks: LibraryAggregatedBookRow[] = filteredBooks;
  let listTotalForPager = filteredBooks.length;
  let toolbarPage = 1;

  if (tab === "owned") {
    listTotalForPager = filteredBooks.length;
    toolbarPage = ownedPage;
    const start = (ownedPage - 1) * PAGE_SIZE;
    pagedBooks = filteredBooks.slice(start, start + PAGE_SIZE);
  } else if (tab === "unread") {
    listTotalForPager = filteredBooks.length;
    toolbarPage = unreadPage;
    const start = (unreadPage - 1) * PAGE_SIZE;
    pagedBooks = filteredBooks.slice(start, start + PAGE_SIZE);
  } else if (tab === "completed") {
    listTotalForPager = filteredBooks.length;
    toolbarPage = completedPage;
    const start = (completedPage - 1) * PAGE_SIZE;
    pagedBooks = filteredBooks.slice(start, start + PAGE_SIZE);
  } else if (tab === "hall") {
    listTotalForPager = filteredBooks.length;
    toolbarPage = hallPage;
    const start = (hallPage - 1) * PAGE_SIZE;
    pagedBooks = filteredBooks.slice(start, start + PAGE_SIZE);
  } else if (tab === "reading") {
    listTotalForPager = filteredBooks.length;
    toolbarPage = 1;
    pagedBooks = filteredBooks.slice(0, READING_SHELF_LIMIT);
  }

  const isOwner = lib.myRole === "owner";

  const sideLinkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 px-4 py-3 transition-transform hover:translate-x-1",
      active
        ? "border-l-2 border-[#e9c176] bg-[#1a3021]/5 font-bold text-[#051b0e]"
        : "text-[#1a3021]/70 hover:bg-[#1a3021]/5",
    );

  const sideHref = (t: LibraryBookTab) =>
    libraryDetailHref(libraryId, {
      tab: t === "owned" ? undefined : t,
      genre: genreFilter || undefined,
      owner: ownerFilter || undefined,
    });

  const emptyTabMessage = (() => {
    if (books.length === 0) return "아직 이 서가에 올라온 책이 없습니다.";
    if (hasActiveBookFilter && filteredBooks.length === 0) {
      return emptyLibraryBooksFilterMessage(genreFilter, ownerFilter);
    }
    switch (tab) {
      case "reading":
        return "멤버 중 누구도「읽는 중」으로 둔 책이 없습니다.";
      case "unread":
        return "멤버 중「읽기 전」인 소장이 없습니다.";
      case "completed":
        return "멤버 중 완독으로 표시된 소장이 없습니다.";
      case "hall":
        return "Hall of Fame(완독·개인 평점 4점 이상)에 해당하는 소장이 없습니다.";
      default:
        return "표시할 책이 없습니다.";
    }
  })();

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-[#1b1c19] selection:bg-[#e9c176] selection:text-[#261900]">
      <div className="flex min-h-screen">
        <aside
          className="fixed left-0 top-20 z-40 hidden h-[calc(100vh-5rem)] w-72 flex-col overflow-y-auto border-r border-[#051b0e]/10 bg-[#fbf9f4] px-5 py-8 lg:flex"
          aria-label="모임서가 컬렉션·멤버"
        >
          <div className="mb-8">
            <h3 className="mb-1 font-sans text-[0.75rem] font-bold uppercase tracking-widest text-[#051b0e]">
              Collections
            </h3>
            <p className="font-sans text-[0.65rem] text-[#1a3021]/60">
              멤버 소장 기준
            </p>
          </div>
          <nav className="space-y-2">
            <Link
              href={sideHref("owned")}
              className={sideLinkClass(tab === "owned")}
            >
              <Library className="size-5 shrink-0" aria-hidden />
              <span className="font-sans text-[0.75rem] uppercase tracking-widest">
                All ({ownedTotalAll.toLocaleString("ko-KR")})
              </span>
            </Link>
            <Link
              href={sideHref("reading")}
              className={sideLinkClass(tab === "reading")}
            >
              <BookOpen className="size-5 shrink-0" aria-hidden />
              <span className="font-sans text-[0.75rem] uppercase tracking-widest">
                Reading ({readingTotal.toLocaleString("ko-KR")})
              </span>
            </Link>
            <Link
              href={sideHref("unread")}
              className={sideLinkClass(tab === "unread")}
            >
              <Bookmark className="size-5 shrink-0" aria-hidden />
              <span className="font-sans text-[0.75rem] uppercase tracking-widest">
                To Read ({unreadTotal.toLocaleString("ko-KR")})
              </span>
            </Link>
            <Link
              href={sideHref("completed")}
              className={sideLinkClass(tab === "completed")}
            >
              <CheckCircle className="size-5 shrink-0" aria-hidden />
              <span className="font-sans text-[0.75rem] uppercase tracking-widest">
                Completed ({completedTotal.toLocaleString("ko-KR")})
              </span>
            </Link>
            <Link
              href={sideHref("hall")}
              className={sideLinkClass(tab === "hall")}
            >
              <Medal className="size-5 shrink-0" aria-hidden />
              <span className="font-sans text-[0.75rem] uppercase tracking-widest">
                Hall of Fame ({hallTotal.toLocaleString("ko-KR")})
              </span>
            </Link>
          </nav>

          <div className="mt-10 border-t border-[#051b0e]/10 pt-8">
            <LibraryMembersSidebar
              libraryId={libraryId}
              initialMembers={members}
              currentUserId={session.user.id}
              isOwner={isOwner}
            />
          </div>
        </aside>

        <main className="flex-1 px-6 pb-24 pt-10 md:px-12 lg:ml-72 lg:px-16">
          <nav
            className="mb-8 flex gap-1 overflow-x-auto pb-2 lg:hidden"
            aria-label="모임서가 보기 탭"
          >
            {(
              [
                [
                  "owned",
                  `All (${ownedTotalAll})`,
                  sideHref("owned"),
                  tab === "owned",
                ],
                [
                  "reading",
                  `Reading (${readingTotal})`,
                  sideHref("reading"),
                  tab === "reading",
                ],
                [
                  "unread",
                  `To Read (${unreadTotal})`,
                  sideHref("unread"),
                  tab === "unread",
                ],
                [
                  "completed",
                  `Done (${completedTotal})`,
                  sideHref("completed"),
                  tab === "completed",
                ],
                [
                  "hall",
                  `HoF (${hallTotal})`,
                  sideHref("hall"),
                  tab === "hall",
                ],
              ] as const
            ).map(([key, label, href, active]) => (
              <Link
                key={key}
                href={href}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider",
                  active
                    ? "border-[#e9c176] bg-[#1a3021]/5 text-[#051b0e]"
                    : "border-[#051b0e]/15 text-[#1a3021]/70",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#675d53]">
                {LIBRARY_KIND_LABELS[lib.kind]}
              </p>
              <h1 className="font-sans text-2xl font-bold italic text-[#051b0e]">
                {lib.name}
              </h1>
              {lib.description ? (
                <p className="mt-1 max-w-2xl text-sm text-[#434843]">
                  {lib.description}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={"/dashboard/libraries" as Route}>목록</Link>
              </Button>
              <Button size="sm" asChild>
                <Link
                  href={`/dashboard/libraries/${libraryId}/books/new` as Route}
                >
                  책 추가
                </Link>
              </Button>
              {isOwner ? <DeleteLibraryButton libraryId={libraryId} /> : null}
            </div>
          </div>

          <section className="space-y-6" aria-labelledby="lib-books-heading">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h2
                id="lib-books-heading"
                className="font-serif text-3xl text-[#051b0e]"
              >
                {tabSectionLabel(tab)}
              </h2>
              {tab === "hall" ? (
                <span className="font-sans text-xs uppercase tracking-widest text-[#e9c176]">
                  완독 · 개인 평점 4점 이상
                </span>
              ) : null}
            </div>

            {books.length > 0 ? (
              <div className="flex flex-col gap-3 rounded-lg border border-[#051b0e]/10 bg-white/30 p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-[#434843]">
                  <span className="tabular-nums">
                    {hasActiveBookFilter
                      ? `이 탭 전체 ${tabSource.length.toLocaleString("ko-KR")}권 · 표시 ${filteredBooks.length.toLocaleString("ko-KR")}권`
                      : `이 탭 ${tabSource.length.toLocaleString("ko-KR")}권`}
                  </span>
                  {tab === "owned" ? (
                    <span className="text-xs text-[#675d53]">
                      서가 전체 {books.length.toLocaleString("ko-KR")}권(합본
                      기준)
                    </span>
                  ) : null}
                </div>
                <LibraryGenreFilter
                  libraryId={libraryId}
                  genres={libraryGenreSlugs}
                  selectedGenre={genreFilter}
                  selectedOwnerUserId={ownerFilter}
                  tab={tab}
                />
                {showOwnerFilter ? (
                  <LibraryOwnerFilter
                    libraryId={libraryId}
                    owners={ownerFilterOptions}
                    selectedOwnerUserId={ownerFilter}
                    selectedGenre={genreFilter}
                    tab={tab}
                  />
                ) : null}
              </div>
            ) : null}

            {books.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#051b0e]/15 bg-[#f5f3ee]/50 py-10 text-center text-sm text-[#434843]">
                아직 책이 없습니다.「책 추가」로 멤버 소장을 올려 보세요.
              </p>
            ) : pagedBooks.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#051b0e]/15 bg-[#f5f3ee]/50 py-10 text-center text-sm text-[#434843]">
                {emptyTabMessage}
              </p>
            ) : (
              <>
                <LibraryBookshelf libraryId={libraryId} books={pagedBooks} />
                {tab === "reading" &&
                listTotalForPager > READING_SHELF_LIMIT ? (
                  <p className="text-xs text-[#675d53]">
                    읽는 중인 책이 {listTotalForPager.toLocaleString("ko-KR")}
                    권입니다. 앞선 {READING_SHELF_LIMIT.toLocaleString("ko-KR")}
                    권만 표시합니다. ALL 탭에서 장르·소유자 필터로 좁혀 보세요.
                  </p>
                ) : null}
                {tab === "owned" ||
                tab === "unread" ||
                tab === "completed" ||
                tab === "hall" ? (
                  <LibraryBooksPagination
                    libraryId={libraryId}
                    page={toolbarPage}
                    pageSize={PAGE_SIZE}
                    total={listTotalForPager}
                    tab={tab}
                    genreSlug={genreFilter}
                    ownerUserId={ownerFilter}
                    sectionLabel={tabSectionLabel(tab)}
                  />
                ) : null}
              </>
            )}
          </section>

          <div className="mt-10 rounded-lg border border-[#051b0e]/10 bg-white/40 p-4 lg:hidden">
            <LibraryMembersSidebar
              libraryId={libraryId}
              initialMembers={members}
              currentUserId={session.user.id}
              isOwner={isOwner}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
