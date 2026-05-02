import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BOOKS_PER_SHELF } from "@/components/books/bookshelf-shared";
import {
  DashboardBooksPagination,
  DashboardBooksToolbar,
} from "@/components/dashboard/dashboard-books-toolbar";
import { DashboardBookCollectionViewClient } from "@/components/dashboard/dashboard-book-collection-view.client";
import { DashboardCollectionTabs } from "@/components/dashboard/dashboard-collection-tabs";
import { DashboardShelfEmptyState } from "@/components/dashboard/dashboard-shelf-empty-state";
import { DashboardOwnedGenreFilter } from "@/components/dashboard/dashboard-owned-genre-filter";
import { DashboardCurrentReadingFeatured } from "@/components/dashboard/dashboard-current-reading-featured";
import { DashboardHomeHero } from "@/components/dashboard/dashboard-home-hero";
import { DashboardMonthReadingStats } from "@/components/dashboard/dashboard-month-reading-stats";
import { DashboardReadingEventsCalendar } from "@/components/dashboard/dashboard-reading-events-calendar.client";
import { DashboardRecommendationPanel } from "@/components/books/dashboard-recommendation-panel.client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildDashboardHref,
  parseDashboardOwnedSort,
  parseDashboardTab,
} from "@/lib/dashboard/dashboard-href";
import { cn } from "@/lib/utils";
import {
  listUserBooksPaged,
  listUserOwnedGenreSlugs,
} from "@/lib/books/repository";
import { getReadingEventsCalendar } from "@/lib/books/user-book-sidecars";
import { aggregateUtcMonthCalendarToWeekBars } from "@/lib/dashboard/reading-calendar-weeks";
import { getAppProfile } from "@/lib/auth/app-profiles";

import type { UserBookSummary } from "@bookfolio/shared";

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

type DashboardPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    genre?: string;
    tab?: string;
    sort?: string;
  }>;
};

/**
 * 로그인 사용자의 읽는 중·소장 책장(에디토리얼 내 서가 레이아웃).
 *
 * @history
 * - 2026-04-22: 내 취향 추천 패널(`DashboardRecommendationPanel`) 추가, `/api/me/recommendations` 연동
 * - 2026-04-12: Hall of Fame은 `tab=hall`에서만 선반 그리드·페이지네이션; 다른 탭에서는 HoF 구역 미표시
 * - 2026-04-12: 컬렉션 권수·탭 목록은 소장/읽기상태 전체; `p_hall_of_fame`는 Hall of Fame 탭·사이드 카운트만
 * - 2026-04-12: Hall of Fame 전용 목록(`p_hall_of_fame`/`0038`)·사이드 권수·ALL에서만 검색·선반·커버 스케일·상단 탭·가격 합계 제거
 * - 2026-04-12: 스티치 HTML 목업 기반 UI — 사이드 컬렉션·Hall of Fame·목판 선반 그리드·소장 `sort=title`(`0037`)
 * - 2026-04-05: 빈 서가 안내 카피 서가담 표기
 * - 2026-03-26: 독서 이벤트 캘린더(`DashboardReadingEventsCalendar`, `/api/me/reading-events/calendar`)
 * - 2026-03-26: 좌측 메뉴 카드 제거, 읽기 상태·소장 `tab` 탭, 상단 통계 카드(모바일형 지표)
 * - 2026-03-25: 사이드 카드에 OAuth 등 `session.user.image` 있으면 아바타 표시
 * - 2026-03-25: 사이드 카드에 「초이스 신간」 링크(`/dashboard/choice-new`)
 * - 2026-03-25: 사이드 카드에 「베스트셀러」 링크(`/dashboard/bestsellers`)
 * - 2026-03-24: 소장 장르 필터(`genre` 쿼리, `listUserOwnedGenreSlugs`·RPC `p_genre_slug`)
 * - 2026-03-24: `PAGE_SIZE` = `BOOKS_PER_SHELF` import(선반 줄 수·한 줄 권수 상수와 동기)
 * - 2026-03-24: 소장 총권수 보정·소장 하단 페이지네이션(`DashboardBooksPagination`)
 * - 2026-05-03: 표지/책등 전환(`DashboardBookCollectionViewClient`)·그리드는 `dashboard-editorial-book-grid`
 * - 2026-05-03: 스티치형 톤 통일 — 사이드·히어로·빈 상태·툴바·전 탭 목록
 * - 2026-05-03: 좌측 컬렉션 제거·히어로 아래 가로 탭; 책등 단일 선반·가로 페이지
 * - 2026-05-03: 「현재 읽고 있는 도서」는 `tab=reading`일 때만 표시
 * - 2026-05-03: 시안형 히어로·현재 읽는 책 카드·월간 독서 통계·`#F8F9FA` / `#1A3C2F` 팔레트
 */
export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const genreFilter = (sp.genre ?? "").trim();
  const tab = parseDashboardTab(sp.tab);
  const ownedSort = parseDashboardOwnedSort(sp.sort);
  const pageRaw = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const ctx = { userId: session.user.id, useAdmin: true } as const;
  const searchOpt = q ? q : undefined;
  const genreSlugOpt = genreFilter ? genreFilter : undefined;
  const ownedListSort = ownedSort === "title" ? ("title" as const) : undefined;

  const refUtc = new Date();
  const { from: monthCalFrom, to: monthCalTo } = utcMonthFromTo(refUtc);

  const [
    hallTotalProbe,
    ownedAllCountProbe,
    readingCountProbe,
    unreadCountProbe,
    completedCountProbe,
    searchProbeRes,
    appProfile,
  ] = await Promise.all([
    listUserBooksPaged(
      { isOwned: true, limit: 1, offset: 0, hallOfFameOnly: true },
      ctx,
    ),
    listUserBooksPaged({ isOwned: true, limit: 1, offset: 0 }, ctx),
    listUserBooksPaged({ readingStatus: "reading", limit: 1, offset: 0 }, ctx),
    listUserBooksPaged({ readingStatus: "unread", limit: 1, offset: 0 }, ctx),
    listUserBooksPaged(
      {
        readingStatus: "completed",
        limit: 1,
        offset: 0,
      },
      ctx,
    ),
    q.length > 0 && tab === "owned"
      ? listUserBooksPaged(
          {
            isOwned: true,
            limit: 1,
            offset: 0,
            search: searchOpt,
          },
          ctx,
        )
      : Promise.resolve({ total: 0, items: [] as never[] }),
    getAppProfile(session.user.id),
  ]);

  const hallTotalAll = hallTotalProbe.total;
  const hallTotalPages = Math.max(1, Math.ceil(hallTotalAll / PAGE_SIZE));
  const ownedTotalAll = ownedAllCountProbe.total;
  const emptyLibrary = ownedTotalAll === 0 && !q;
  const showBookSections = !(ownedTotalAll === 0 && !q);

  if (tab === "reading" && pageRaw > 1) {
    redirect(
      buildDashboardHref({ q, genre: genreFilter, page: 1, tab: "reading" }),
    );
  }

  const readingForShelfP = showBookSections
    ? listUserBooksPaged(
        {
          readingStatus: "reading",
          limit: READING_SHELF_LIMIT,
          offset: 0,
        },
        ctx,
      )
    : Promise.resolve({
        items: [] as UserBookSummary[],
        total: readingCountProbe.total,
      });

  const hallListP =
    tab === "hall" && showBookSections
      ? listUserBooksPaged(
          {
            isOwned: true,
            hallOfFameOnly: true,
            limit: PAGE_SIZE,
            offset: (pageRaw - 1) * PAGE_SIZE,
          },
          ctx,
        )
      : Promise.resolve({
          items: [] as UserBookSummary[],
          total: hallTotalAll,
        });

  const unreadListP =
    tab === "unread"
      ? listUserBooksPaged(
          {
            readingStatus: "unread",
            limit: PAGE_SIZE,
            offset: (pageRaw - 1) * PAGE_SIZE,
          },
          ctx,
        )
      : Promise.resolve({
          items: [] as UserBookSummary[],
          total: unreadCountProbe.total,
        });

  const completedListP =
    tab === "completed"
      ? listUserBooksPaged(
          {
            readingStatus: "completed",
            limit: PAGE_SIZE,
            offset: (pageRaw - 1) * PAGE_SIZE,
          },
          ctx,
        )
      : Promise.resolve({
          items: [] as UserBookSummary[],
          total: completedCountProbe.total,
        });

  const ownedListP =
    tab === "owned"
      ? listUserBooksPaged(
          {
            isOwned: true,
            search: searchOpt,
            genreSlug: genreSlugOpt,
            limit: PAGE_SIZE,
            offset: (pageRaw - 1) * PAGE_SIZE,
            sort: ownedListSort,
          },
          ctx,
        )
      : listUserBooksPaged(
          {
            isOwned: true,
            limit: 1,
            offset: 0,
          },
          ctx,
        );

  const monthStatsP =
    showBookSections
      ? Promise.all([
          listUserBooksPaged(
            {
              isOwned: true,
              readingStatus: "completed",
              limit: 5000,
              offset: 0,
            },
            ctx,
          ),
          getReadingEventsCalendar(monthCalFrom, monthCalTo, ctx),
        ])
      : Promise.resolve(null);

  const [readingRes, hallRes, unreadRes, completedRes, ownedRes, ownedGenres, monthStatsBundle] =
    await Promise.all([
      readingForShelfP,
      hallListP,
      unreadListP,
      completedListP,
      ownedListP,
      tab === "owned"
        ? listUserOwnedGenreSlugs(ctx)
        : Promise.resolve([] as string[]),
      monthStatsP,
    ]);

  const readingBooks = readingRes.items;
  const readingTotal = readingRes.total;
  const unreadBooks = unreadRes.items;
  const unreadTotal = unreadRes.total;
  const completedBooks = completedRes.items;
  const completedTotal = completedRes.total;
  const ownedBooks = ownedRes.items;
  const hallBooks = hallRes.items;
  const hallListTotal = hallRes.total;

  let weekBars = [0, 0, 0, 0];
  let booksFinishedThisMonth = 0;
  let averageRating: number | null = null;
  if (monthStatsBundle) {
    const [completedForStats, calMap] = monthStatsBundle;
    booksFinishedThisMonth = completedForStats.items.filter((b) =>
      isUtcSameCalendarMonth(b.updatedAt, refUtc),
    ).length;
    const rated = completedForStats.items.filter(
      (b) => b.rating != null && b.rating >= 1 && b.rating <= 5,
    );
    if (rated.length > 0) {
      averageRating =
        rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length;
    }
    weekBars = aggregateUtcMonthCalendarToWeekBars(calMap, refUtc);
  }

  const displayLabelHero =
    appProfile?.displayName?.trim() ||
    session.user.name?.trim() ||
    session.user.email?.trim() ||
    "사용자";
  const heroTagline =
    appProfile?.annualReadingGoal != null
      ? `올해 독서 목표 ${appProfile.annualReadingGoal.toLocaleString("ko-KR")}권을 향해 한 권씩 쌓아 가요.`
      : "기록되지 않은 삶은 망각의 뒤편으로 사라집니다. 오늘의 한 줄을 남겨 보세요.";
  const avgRatingDisplay =
    averageRating != null ? `${averageRating.toFixed(1)}/5` : "—";
  const primaryReadingBook =
    readingBooks.length > 0 ? readingBooks[0]! : null;

  const ownedTotalForPager = ownedRes.total;

  const ownedTotalPages = Math.max(
    1,
    Math.ceil(ownedTotalForPager / PAGE_SIZE),
  );
  const unreadTotalPages = Math.max(1, Math.ceil(unreadTotal / PAGE_SIZE));
  const completedTotalPages = Math.max(
    1,
    Math.ceil(completedTotal / PAGE_SIZE),
  );

  const ownedPage =
    ownedTotalForPager === 0 ? 1 : Math.min(pageRaw, ownedTotalPages);
  const unreadPage =
    unreadTotal === 0 ? 1 : Math.min(pageRaw, unreadTotalPages);
  const completedPage =
    completedTotal === 0 ? 1 : Math.min(pageRaw, completedTotalPages);

  const hallPage = hallListTotal === 0 ? 1 : Math.min(pageRaw, hallTotalPages);

  if (tab === "owned" && ownedTotalForPager > 0 && pageRaw > ownedTotalPages) {
    const np = new URLSearchParams();
    if (q) np.set("q", q);
    if (genreFilter) np.set("genre", genreFilter);
    np.set("tab", "owned");
    np.set("page", String(ownedTotalPages));
    if (ownedSort === "title") np.set("sort", "title");
    redirect(`/dashboard?${np.toString()}` as Route);
  }

  if (tab === "unread" && unreadTotal > 0 && pageRaw > unreadTotalPages) {
    redirect(
      buildDashboardHref({
        q,
        page: unreadTotalPages,
        tab: "unread",
      }),
    );
  }

  if (
    tab === "completed" &&
    completedTotal > 0 &&
    pageRaw > completedTotalPages
  ) {
    redirect(
      buildDashboardHref({
        q,
        page: completedTotalPages,
        tab: "completed",
      }),
    );
  }

  if (tab === "hall" && hallListTotal > 0 && pageRaw > hallTotalPages) {
    redirect(
      buildDashboardHref({
        q,
        page: hallTotalPages,
        tab: "hall",
      }),
    );
  }

  const emptySearch =
    !emptyLibrary &&
    q.length > 0 &&
    tab === "owned" &&
    searchProbeRes.total === 0;

  let listTotalForToolbar = 0;
  let toolbarPage = 1;
  if (tab === "reading") {
    listTotalForToolbar = readingTotal;
    toolbarPage = 1;
  } else if (tab === "unread") {
    listTotalForToolbar = unreadTotal;
    toolbarPage = unreadPage;
  } else if (tab === "completed") {
    listTotalForToolbar = completedTotal;
    toolbarPage = completedPage;
  } else if (tab === "hall") {
    listTotalForToolbar = hallListTotal;
    toolbarPage = hallPage;
  } else {
    listTotalForToolbar = ownedTotalForPager;
    toolbarPage = ownedPage;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1b1c19] selection:bg-[#c5e6d4] selection:text-[#0f241c]">
      <main className="px-4 pb-28 pt-8 md:px-8 md:pb-24 md:pt-10 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <DashboardHomeHero
            displayLabel={displayLabelHero}
            avatarUrl={appProfile?.avatarUrl ?? null}
            totalBooks={ownedTotalAll}
            booksFinishedThisMonth={booksFinishedThisMonth}
            averageRating={averageRating}
            tagline={heroTagline}
          />

          <section
            className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8"
            aria-label="현재 읽는 책과 독서 통계"
          >
            <div className="lg:col-span-7">
              <DashboardCurrentReadingFeatured
                book={showBookSections ? primaryReadingBook : null}
              />
            </div>
            <div className="lg:col-span-5">
              <DashboardMonthReadingStats
                weekBars={weekBars}
                booksReadThisMonth={booksFinishedThisMonth}
                avgRatingDisplay={avgRatingDisplay}
              />
            </div>
          </section>

          {!emptyLibrary ? (
            <section
              className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-2"
              aria-label="홈 인사이트 패널"
            >
              <DashboardRecommendationPanel />
              <DashboardReadingEventsCalendar />
            </section>
          ) : null}

          {!emptyLibrary ? (
            <div className="mb-4 space-y-5">
              <DashboardBooksToolbar
                searchQuery={q}
                page={toolbarPage}
                pageSize={tab === "reading" ? READING_SHELF_LIMIT : PAGE_SIZE}
                listTotal={listTotalForToolbar}
                currentTab={tab}
                genreSlug={genreFilter}
                ownedSort={ownedSort}
                renderedCount={
                  tab === "reading" ? readingBooks.length : undefined
                }
                showSearch={tab === "owned"}
              />
            </div>
          ) : null}

          <DashboardCollectionTabs
            currentTab={tab}
            searchQuery={q}
            genreSlug={genreFilter}
            ownedSort={ownedSort}
            counts={{
              owned: ownedAllCountProbe.total,
              reading: readingCountProbe.total,
              unread: unreadCountProbe.total,
              completed: completedCountProbe.total,
              hall: hallTotalAll,
            }}
          />

          {emptyLibrary ? (
            <Card className="rounded-xl border border-dashed border-[#051b0e]/20 bg-white/70 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="font-serif text-xl text-[#051b0e]">
                  소장 도서가 아직 없습니다
                </CardTitle>
                <CardDescription className="text-[#434843]">
                  첫 책을 서가에 등록해 보세요. 완독 후 개인 평점 4점 이상이면
                  명예의 전당(Hall of Fame)에도 올릴 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="bg-[#1a3021] text-white hover:bg-[#1a3021]/90"
                >
                  <Link href="/dashboard/books/new">책 등록하기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {emptySearch ? (
            <Card className="rounded-xl border border-dashed border-[#051b0e]/20 bg-white/70 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="font-serif text-xl text-[#051b0e]">
                  검색 결과가 없습니다
                </CardTitle>
                <CardDescription className="text-[#434843]">
                  「{q}」에 맞는 책이 없습니다. 다른 키워드로 시도하거나{" "}
                  <Link
                    href="/dashboard"
                    className="font-medium text-[#163826] underline-offset-4 hover:underline"
                  >
                    전체 목록
                  </Link>
                  으로 돌아가 보세요.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {!emptyLibrary &&
          !emptySearch &&
          tab === "reading" &&
          readingBooks.length > 0 ? (
            <section
              className="mb-12 md:mb-16"
              aria-labelledby="dash-reading-shelf-heading"
            >
              <h2
                id="dash-reading-shelf-heading"
                className="mb-6 border-b border-[#1A3C2F]/10 pb-3 font-serif text-xl text-[#1A3C2F] sm:text-2xl"
              >
                {readingBooks.length > 1
                  ? "읽는 중인 책 전체"
                  : "읽는 중인 책"}
              </h2>
              <DashboardBookCollectionViewClient
                books={readingBooks}
                editorialVariant="reading"
              />
            </section>
          ) : null}

          {!emptyLibrary && !emptySearch ? (
            <div className="space-y-20 md:space-y-32">
              {tab === "reading" ? (
                readingBooks.length === 0 ? (
                  <DashboardShelfEmptyState
                    title="지금 읽는 책이 없습니다"
                    description="위 탭의 「전체」에서 책을 등록하거나, 읽기 상태를 바꿔 보세요."
                  />
                ) : readingTotal > READING_SHELF_LIMIT ? (
                  <p className="rounded-lg border border-[#051b0e]/10 bg-white/50 px-4 py-3 text-xs text-[#675d53]">
                    읽는 중인 책이 {readingTotal.toLocaleString("ko-KR")}
                    권입니다. 나머지는 「전체」탭에서 제목·저자 검색으로 찾아
                    보세요.
                  </p>
                ) : null
              ) : null}

              {tab === "unread" ? (
                <section
                  className="space-y-8"
                  aria-labelledby="dash-unread-heading"
                >
                  <h2
                    id="dash-unread-heading"
                    className="border-b border-[#051b0e]/10 pb-3 font-serif text-2xl text-[#051b0e] sm:text-3xl"
                  >
                    읽기 전
                  </h2>
                  {unreadBooks.length > 0 ? (
                    <>
                      <DashboardBookCollectionViewClient
                        books={unreadBooks}
                        editorialVariant="owned"
                      />
                      <DashboardBooksPagination
                        searchQuery={q}
                        page={unreadPage}
                        pageSize={PAGE_SIZE}
                        total={unreadTotal}
                        tab="unread"
                        sectionLabel="읽기 전"
                      />
                    </>
                  ) : (
                    <DashboardShelfEmptyState
                      title={
                        q.length > 0 || genreFilter.length > 0
                          ? "표시할 책이 없습니다"
                          : "읽기 전인 책이 없습니다"
                      }
                      description={
                        q.length > 0 || genreFilter.length > 0
                          ? "검색·필터를 바꾸거나 다른 컬렉션을 눌러 보세요."
                          : "새 책을 등록하거나, 읽는 중인 책의 상태를 바꿔 보세요."
                      }
                    />
                  )}
                </section>
              ) : null}

              {tab === "completed" ? (
                <section
                  className="space-y-8"
                  aria-labelledby="dash-completed-heading"
                >
                  <h2
                    id="dash-completed-heading"
                    className="border-b border-[#051b0e]/10 pb-3 font-serif text-2xl text-[#051b0e] sm:text-3xl"
                  >
                    완료
                  </h2>
                  {completedBooks.length > 0 ? (
                    <>
                      <DashboardBookCollectionViewClient
                        books={completedBooks}
                        editorialVariant="owned"
                      />
                      <DashboardBooksPagination
                        searchQuery={q}
                        page={completedPage}
                        pageSize={PAGE_SIZE}
                        total={completedTotal}
                        tab="completed"
                        sectionLabel="완료"
                      />
                    </>
                  ) : (
                    <DashboardShelfEmptyState
                      title={
                        q.length > 0 || genreFilter.length > 0
                          ? "표시할 책이 없습니다"
                          : "완독으로 표시된 책이 없습니다"
                      }
                      description={
                        q.length > 0 || genreFilter.length > 0
                          ? "검색·필터를 바꿔 보세요."
                          : "책을 다 읽었다면 상세 화면에서 완독으로 바꿀 수 있습니다."
                      }
                    />
                  )}
                </section>
              ) : null}

              {tab === "hall" ? (
                <section
                  className="space-y-8"
                  aria-labelledby="dash-hall-heading"
                >
                  <div className="flex flex-col gap-2 border-b border-[#051b0e]/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
                    <h2
                      id="dash-hall-heading"
                      className="font-serif text-2xl text-[#051b0e] sm:text-3xl"
                    >
                      Hall of Fame
                    </h2>
                    <span className="font-sans text-xs uppercase tracking-[0.18em] text-[#b8892e]">
                      완독 · 개인 평점 4점 이상
                    </span>
                  </div>
                  {hallBooks.length > 0 ? (
                    <>
                      <DashboardBookCollectionViewClient
                        books={hallBooks}
                        editorialVariant="owned"
                      />
                      <DashboardBooksPagination
                        searchQuery={q}
                        page={hallPage}
                        pageSize={PAGE_SIZE}
                        total={hallListTotal}
                        tab="hall"
                        sectionLabel="Hall of Fame"
                      />
                    </>
                  ) : (
                    <DashboardShelfEmptyState
                      title="명예의 전당이 비어 있습니다"
                      description="완독이면서 개인 평점 4점 이상인 소장 도서가 여기에 올라갑니다."
                    />
                  )}
                </section>
              ) : null}

              {tab === "owned" ? (
                <section
                  className="space-y-8"
                  aria-labelledby="dash-owned-heading"
                >
                  <div className="flex flex-col gap-4 border-b border-[#051b0e]/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
                    <h2
                      id="dash-owned-heading"
                      className="font-serif text-2xl text-[#051b0e] sm:text-3xl"
                    >
                      전체 도서
                    </h2>
                    <div className="flex flex-wrap items-center gap-6">
                      <Link
                        href={buildDashboardHref({
                          q,
                          genre: genreFilter,
                          page: 1,
                          tab: "owned",
                        })}
                        className={cn(
                          "font-sans text-xs uppercase tracking-[0.18em] transition-colors",
                          ownedSort === "recent"
                            ? "border-b border-[#051b0e] text-[#051b0e]"
                            : "border-b border-transparent text-[#434843] hover:border-[#051b0e]",
                        )}
                      >
                        최근 추가순
                      </Link>
                      <Link
                        href={buildDashboardHref({
                          q,
                          genre: genreFilter,
                          page: 1,
                          tab: "owned",
                          ownedSort: "title",
                        })}
                        className={cn(
                          "font-sans text-xs uppercase tracking-[0.18em] transition-colors",
                          ownedSort === "title"
                            ? "border-b border-[#051b0e] text-[#051b0e]"
                            : "border-b border-transparent text-[#434843]/50 hover:border-[#051b0e]",
                        )}
                      >
                        제목순
                      </Link>
                    </div>
                  </div>
                  <DashboardOwnedGenreFilter
                    genres={ownedGenres}
                    selectedGenre={genreFilter}
                    searchQuery={q}
                    ownedSort={ownedSort}
                  />
                  {ownedBooks.length > 0 ? (
                    <>
                      <DashboardBookCollectionViewClient
                        books={ownedBooks}
                        editorialVariant="owned"
                      />
                      <DashboardBooksPagination
                        searchQuery={q}
                        page={ownedPage}
                        pageSize={PAGE_SIZE}
                        total={ownedTotalForPager}
                        genreSlug={genreFilter}
                        tab="owned"
                        sectionLabel="소장"
                        ownedSort={ownedSort}
                      />
                    </>
                  ) : (
                    <DashboardShelfEmptyState
                      title={
                        q.length > 0 || genreFilter.length > 0
                          ? "조건에 맞는 도서가 없습니다"
                          : "표시할 소장 도서가 없습니다"
                      }
                      description={
                        q.length > 0 || genreFilter.length > 0
                          ? "검색어·장르 필터를 바꾸거나 초기화해 보세요."
                          : "아직 이 목록에 올 책이 없습니다."
                      }
                    />
                  )}
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>

      {!emptyLibrary ? (
        <Link
          href="/dashboard/books/new"
          className="group fixed bottom-10 right-6 z-50 flex size-14 items-center justify-center rounded-full border border-[#1A3C2F]/25 bg-[#1A3C2F] text-white shadow-[0_12px_40px_rgba(26,60,47,0.35)] transition-transform hover:scale-105 md:bottom-12 md:right-12 md:size-16"
          aria-label="새 도서 추가"
        >
          <span className="text-2xl font-light leading-none md:text-3xl">
            +
          </span>
          <span className="pointer-events-none absolute right-[calc(100%+0.75rem)] whitespace-nowrap rounded-lg border border-[#1A3C2F]/15 bg-[#1A3C2F] px-3 py-2 font-sans text-[0.65rem] uppercase tracking-[0.18em] opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            새 도서 추가
          </span>
        </Link>
      ) : null}
    </div>
  );
}
