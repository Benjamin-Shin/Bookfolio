import type {
  LibraryAggregatedBookRow,
  LibraryMemberRow,
} from "@bookfolio/shared";
import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BOOKS_PER_SHELF } from "@/components/books/bookshelf-shared";
import { EditorialGrid } from "@/components/dashboard/dashboard-editorial-book-grid";
import { DashboardMonthReadingStats } from "@/components/dashboard/dashboard-month-reading-stats";
import {
  libraryDetailHref,
  parseLibraryBookTab,
  type LibraryBookTab,
} from "@/components/libraries/library-books-list-href";
import { LibraryBooksPagination } from "@/components/libraries/library-books-pagination";
import { LibraryCollectionTabs } from "@/components/libraries/library-collection-tabs";
import { LibraryDetailInfoPanel } from "@/components/libraries/library-detail-info-panel";
import { LibraryEventsCalendar } from "@/components/libraries/library-events-calendar.client";
import { LibraryGenreFilter } from "@/components/libraries/library-genre-filter";
import { LibraryMemberReadingSection } from "@/components/libraries/library-member-reading-section";
import { LibraryOwnerFilter } from "@/components/libraries/library-owner-filter";
import { auth } from "@/auth";
import { listUserBooksPaged } from "@/lib/books/repository";
import { getReadingEventsCalendar } from "@/lib/books/user-book-sidecars";
import {
  aggregateUtcMonthCalendarToWeekBars,
  mergeReadingEventDayCountMaps,
} from "@/lib/dashboard/reading-calendar-weeks";
import {
  getLibrary,
  listLibraryBooks,
  listLibraryMembers,
} from "@/lib/libraries/repository";
import { libraryAggregatedBooksToUserBookSummaries } from "@/lib/libraries/library-aggregated-book-display";

const PAGE_SIZE = BOOKS_PER_SHELF;
const READING_SHELF_LIMIT = 50;

function isUtcSameCalendarMonth(iso: string, ref: Date): boolean {
  const t = new Date(iso);
  return (
    t.getUTCFullYear() === ref.getUTCFullYear() &&
    t.getUTCMonth() === ref.getUTCMonth()
  );
}

function utcMonthFromTo(ref: Date): { from: string; to: string } {
  const y = ref.getUTCFullYear();
  const m = ref.getUTCMonth();
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

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
 * 모임서가 상세 — 대시보드형 본문(정보 패널·회원 읽기·합산 통계·이벤트 2열·내 서가형 표지 선반).
 *
 * @history
 * - 2026-05-04: 일정·RSVP — 멤버 일정 추가, 응답 집계 API(`rsvpTally`)·캘린더 표시
 * - 2026-05-04: 도서 목록 — 내 서가와 동일 `EditorialGrid`(표지·목선반) 단일, 집계 행→`UserBookSummary` 매핑
 * - 2026-05-04: 직접 책 추가 제거·안내 카피 — 소장은 내 서가에서 연결
 * - 2026-05-04: 좌측 컬렉션 제거, 정보 패널·편집 링크·회원 읽는 책·멤버 독서이벤트 합산 통계·일정 캘린더 2열·표지 그리드 상단
 * - 2026-05-03: 모임 일정·RSVP 캘린더(`LibraryEventsCalendar`, `0043`)
 * - 2026-04-12: 에디토리얼 좌측 메뉴(집계 탭·Hall of Fame)·멤버·초대 다이얼로그; `tab`·`page`·`owners.rating`
 * - 2026-03-24: 소유자 필터(`owner`=`userId`)·장르와 쿼리 상호 유지
 * - 2026-03-24: 책 `genre` 쿼리 필터·총·표시 권수·`LibraryGenreFilter`
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

  const refUtc = new Date();
  const { from: monthCalFrom, to: monthCalTo } = utcMonthFromTo(refUtc);
  const memberIds = members.map((m) => m.userId);

  const [calMaps, completedPerMember] =
    memberIds.length > 0
      ? await Promise.all([
          Promise.all(
            memberIds.map((uid) =>
              getReadingEventsCalendar(monthCalFrom, monthCalTo, {
                userId: uid,
                useAdmin: true,
              }),
            ),
          ),
          Promise.all(
            memberIds.map((uid) =>
              listUserBooksPaged(
                { readingStatus: "completed", limit: 5000, offset: 0 },
                { userId: uid, useAdmin: true },
              ),
            ),
          ),
        ])
      : [[], []];

  const mergedCal = mergeReadingEventDayCountMaps(
    calMaps as Record<string, number>[],
  );
  const weekBars = aggregateUtcMonthCalendarToWeekBars(mergedCal, refUtc);

  let booksFinishedThisMonth = 0;
  for (const res of completedPerMember as Awaited<
    ReturnType<typeof listUserBooksPaged>
  >[]) {
    booksFinishedThisMonth += res.items.filter((b) =>
      isUtcSameCalendarMonth(b.updatedAt, refUtc),
    ).length;
  }

  const ratedSlots: number[] = [];
  for (const b of books) {
    for (const o of b.owners) {
      if (
        o.readingStatus === "completed" &&
        o.rating != null &&
        o.rating >= 1 &&
        o.rating <= 5
      ) {
        ratedSlots.push(o.rating);
      }
    }
  }
  const averageRating =
    ratedSlots.length > 0
      ? ratedSlots.reduce((s, r) => s + r, 0) / ratedSlots.length
      : null;
  const avgRatingDisplay =
    averageRating != null ? `${averageRating.toFixed(1)}/5` : "—";

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

  const emptyTabMessage = (() => {
    if (books.length === 0)
      return "아직 이 모임서가에 연결된 책이 없습니다. 멤버는 내 서가에서 도서를 등록한 뒤 이 모임서가에 공유하면 여기에 나타납니다.";
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
    <div className="min-h-screen bg-[#F8F9FA] text-[#1b1c19] selection:bg-[#c5e6d4] selection:text-[#0f241c]">
      <main className="px-4 pb-28 pt-8 md:px-8 md:pb-24 md:pt-10 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-6 space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#675d53]">
              Shared library
            </p>
            <h1 className="font-serif text-3xl text-[#1A3C2F] md:text-4xl">
              모임서가
            </h1>
            <p className="max-w-2xl text-sm text-[#434843]">
              멤버가 각자 「내 서가」에서 등록·연결한 소장이 합쳐져 보입니다. 이
              화면에서는 직접 책을 추가하지 않습니다.
            </p>
          </header>

          <LibraryDetailInfoPanel
            libraryId={libraryId}
            lib={lib}
            members={members}
            currentUserId={session.user.id}
            isOwner={isOwner}
            totalDistinctBooks={books.length}
          />

          <section
            className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8"
            aria-label="회원 읽기 현황과 독서 통계"
          >
            <div className="lg:col-span-7">
              <LibraryMemberReadingSection
                libraryId={libraryId}
                members={members}
                books={books}
              />
            </div>
            <div className="lg:col-span-5">
              <DashboardMonthReadingStats
                weekBars={weekBars}
                booksReadThisMonth={booksFinishedThisMonth}
                avgRatingDisplay={avgRatingDisplay}
                showFooterLink={false}
              />
            </div>
          </section>

          <section className="mb-8" aria-label="모임 일정 캘린더">
            <LibraryEventsCalendar libraryId={libraryId} isOwner={isOwner} />
          </section>

          <LibraryCollectionTabs
            libraryId={libraryId}
            currentTab={tab}
            genreSlug={genreFilter}
            ownerUserId={ownerFilter}
            counts={{
              owned: ownedTotalAll,
              reading: readingTotal,
              unread: unreadTotal,
              completed: completedTotal,
              hall: hallTotal,
            }}
          />

          <section className="space-y-6" aria-labelledby="lib-books-heading">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h2
                id="lib-books-heading"
                className="font-serif text-2xl text-[#1A3C2F] sm:text-3xl"
              >
                {tabSectionLabel(tab)}
              </h2>
              {tab === "hall" ? (
                <span className="font-sans text-xs uppercase tracking-widest text-[#b8860b]">
                  완독 · 개인 평점 4점 이상
                </span>
              ) : null}
            </div>

            {books.length > 0 ? (
              <div className="flex flex-col gap-3 rounded-xl border border-[#1A3C2F]/10 bg-white/80 p-4 shadow-sm">
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
              <div className="rounded-xl border border-dashed border-[#1A3C2F]/20 bg-white/70 px-4 py-10 text-center text-sm text-[#434843]">
                <p className="mx-auto max-w-md">
                  아직 이 모임서가에 연결된 책이 없습니다. 각 멤버는{" "}
                  <Link
                    href={"/dashboard" as Route}
                    className="font-medium text-[#1A3C2F] underline-offset-4 hover:underline"
                  >
                    내 서가
                  </Link>
                  에서 도서를 추가한 뒤 이 모임서가에 공유하면 목록에 표시됩니다.
                </p>
              </div>
            ) : pagedBooks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#1A3C2F]/20 bg-white/70 py-10 text-center text-sm text-[#434843]">
                {emptyTabMessage}
              </p>
            ) : (
              <>
                <EditorialGrid
                  books={libraryAggregatedBooksToUserBookSummaries(pagedBooks)}
                  variant={tab === "reading" ? "reading" : "owned"}
                  getBookHref={(b) => `/libraries/${libraryId}/books/${b.bookId}`}
                />
                {tab === "reading" &&
                listTotalForPager > READING_SHELF_LIMIT ? (
                  <p className="text-xs text-[#675d53]">
                    읽는 중인 책이 {listTotalForPager.toLocaleString("ko-KR")}
                    권입니다. 앞선{" "}
                    {READING_SHELF_LIMIT.toLocaleString("ko-KR")}
                    권만 표시합니다. 전체 탭에서 장르·소유자 필터로 좁혀
                    보세요.
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

          <p className="mt-12">
            <Link
              href={"/dashboard" as Route}
              className="text-sm font-medium text-[#1A3C2F] underline-offset-4 hover:underline"
            >
              내 서가로 돌아가기
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
