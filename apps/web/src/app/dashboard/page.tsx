import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Bookmark, CheckCircle, Library, Medal } from "lucide-react";

import { auth } from "@/auth";
import {
  BOOKS_PER_SHELF,
  BOOKS_PER_VISUAL_ROW,
  chunk,
} from "@/components/books/bookshelf-shared";
import {
  DashboardBooksPagination,
  DashboardBooksToolbar,
} from "@/components/dashboard/dashboard-books-toolbar";
import { DashboardOwnedGenreFilter } from "@/components/dashboard/dashboard-owned-genre-filter";
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

import type { UserBookSummary } from "@bookfolio/shared";

const PAGE_SIZE = BOOKS_PER_SHELF;
const READING_SHELF_LIMIT = 50;

type DashboardPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    genre?: string;
    tab?: string;
    sort?: string;
  }>;
};

function readingProgressPercent(book: UserBookSummary): number | null {
  const total = book.readingTotalPages ?? book.pageCount ?? null;
  const cur = book.currentPage;
  if (total == null || total <= 0 || cur == null || cur < 1) {
    return null;
  }
  return Math.min(100, Math.round((cur / total) * 100));
}

function DashboardShelfBookCover({ book }: { book: UserBookSummary }) {
  const authors = book.authors.join(", ") || "저자 미상";
  if (book.coverUrl) {
    return (
      <img
        src={book.coverUrl}
        alt=""
        className="h-auto max-h-[min(280px,42vw)] w-auto max-w-full object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className="flex aspect-[2/3] w-full max-w-[200px] flex-col justify-between rounded-sm bg-gradient-to-br from-[#e4e2dd] to-[#f0eee9] p-2">
      <p className="line-clamp-4 font-serif text-xs font-medium leading-tight text-[#051b0e]">
        {book.title}
      </p>
      <p className="line-clamp-2 text-[0.65rem] text-[#434843]">{authors}</p>
    </div>
  );
}

function EditorialGrid({
  books,
  variant,
}: {
  books: UserBookSummary[];
  variant: "reading" | "owned";
}) {
  const rows = chunk(books, BOOKS_PER_VISUAL_ROW);
  return (
    <div className="mb-24 space-y-20 md:space-y-24">
      {rows.map((rowBooks, rowIdx) => (
        <div key={rowIdx}>
          <div className="grid grid-cols-2 gap-x-12 md:grid-cols-4 lg:grid-cols-6">
            {rowBooks.map((book) => (
              <div key={book.id} className="group flex flex-col items-center">
                <Link
                  href={`/dashboard/books/${book.id}`}
                  className="flex w-full flex-col items-center text-left"
                >
                  <div className="mb-2 flex w-full justify-center transition-transform group-hover:-translate-y-3">
                    <div className="book-shadow flex max-h-[min(280px,42vw)] items-end justify-center">
                      <DashboardShelfBookCover book={book} />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          <div
            className="wood-shelf mt-2 h-12 w-full shrink-0 opacity-90"
            aria-hidden
          />
          <div className="relative z-10 mt-4 grid grid-cols-2 gap-x-12 md:grid-cols-4 lg:grid-cols-6">
            {rowBooks.map((book) => {
              const authors = book.authors.join(", ") || "저자 미상";
              const pct =
                variant === "reading" ? readingProgressPercent(book) : null;
              return (
                <Link
                  key={`${book.id}-meta`}
                  href={`/dashboard/books/${book.id}`}
                  className="flex flex-col items-center text-center sm:text-left"
                >
                  {variant === "reading" ? (
                    <>
                      <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-[#e4e2dd]">
                        <div
                          className="h-full bg-[#e9c176] transition-[width]"
                          style={{
                            width: pct != null ? `${pct}%` : "0%",
                          }}
                        />
                      </div>
                      <h4 className="line-clamp-2 w-full font-serif text-sm text-[#051b0e]">
                        {book.title}
                      </h4>
                      <p className="font-sans text-[10px] uppercase tracking-widest text-[#434843]">
                        {pct != null ? `${pct}% 완료` : "진행률 미입력"}
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="line-clamp-2 w-full font-serif text-sm text-[#051b0e]">
                        {book.title}
                      </h4>
                      <p className="font-sans text-[10px] uppercase tracking-widest text-[#434843]">
                        {authors}
                      </p>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

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

  const [
    hallTotalProbe,
    ownedAllCountProbe,
    readingCountProbe,
    unreadCountProbe,
    completedCountProbe,
    searchProbeRes,
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

  const [readingRes, hallRes, unreadRes, completedRes, ownedRes, ownedGenres] =
    await Promise.all([
      readingForShelfP,
      hallListP,
      unreadListP,
      completedListP,
      ownedListP,
      tab === "owned"
        ? listUserOwnedGenreSlugs(ctx)
        : Promise.resolve([] as string[]),
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

  const sideLinkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 px-4 py-3 transition-transform hover:translate-x-1",
      active
        ? "border-l-2 border-[#e9c176] bg-[#1a3021]/5 font-bold text-[#051b0e]"
        : "text-[#1a3021]/70 hover:bg-[#1a3021]/5",
    );

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-[#1b1c19] selection:bg-[#e9c176] selection:text-[#261900]">
      <div className="flex min-h-screen">
        <aside
          className="fixed left-0 top-20 z-40 hidden h-[calc(100vh-5rem)] w-64 flex-col border-r border-[#051b0e]/10 bg-[#fbf9f4] px-6 py-8 lg:flex"
          aria-label="컬렉션"
        >
          <div className="mb-10">
            <h3 className="mb-1 font-sans text-[0.75rem] font-bold uppercase tracking-widest text-[#051b0e]">
              Collections
            </h3>
            <p className="font-sans text-[0.65rem] text-[#1a3021]/60">
              Archival filters
            </p>
          </div>
          <nav className="space-y-2">
            <Link
              href={buildDashboardHref({
                q,
                tab: "owned",
                genre: genreFilter,
                ownedSort: ownedSort === "title" ? "title" : undefined,
              })}
              className={sideLinkClass(tab === "owned")}
            >
              <Library className="size-5 shrink-0" aria-hidden />
              <span className="font-sans text-[0.75rem] uppercase tracking-widest">
                All ({ownedAllCountProbe.total.toLocaleString("ko-KR")})
              </span>
            </Link>
            <Link
              href={buildDashboardHref({ tab: "reading" })}
              className={sideLinkClass(tab === "reading")}
            >
              <BookOpen className="size-5 shrink-0" aria-hidden />
              <span className="font-sans text-[0.75rem] uppercase tracking-widest">
                Reading ({readingCountProbe.total.toLocaleString("ko-KR")})
              </span>
            </Link>
            <Link
              href={buildDashboardHref({ tab: "unread" })}
              className={sideLinkClass(tab === "unread")}
            >
              <Bookmark className="size-5 shrink-0" aria-hidden />
              <span className="font-sans text-[0.75rem] uppercase tracking-widest">
                To Read ({unreadCountProbe.total.toLocaleString("ko-KR")})
              </span>
            </Link>
            <Link
              href={buildDashboardHref({ tab: "completed" })}
              className={sideLinkClass(tab === "completed")}
            >
              <CheckCircle className="size-5 shrink-0" aria-hidden />
              <span className="font-sans text-[0.75rem] uppercase tracking-widest">
                Completed ({completedCountProbe.total.toLocaleString("ko-KR")})
              </span>
            </Link>
            <Link
              href={buildDashboardHref({ tab: "hall" })}
              className={sideLinkClass(tab === "hall")}
            >
              <Medal className="size-5 shrink-0" aria-hidden />
              <span className="font-sans text-[0.75rem] uppercase tracking-widest">
                Hall of Fame ({hallTotalAll.toLocaleString("ko-KR")})
              </span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1 px-8 pb-24 pt-12 md:px-16 lg:ml-64">
          <section className="mb-16 max-w-4xl md:mb-20">
            <h1 className="mb-6 font-sans text-2xl font-bold italic text-[#051b0e]">
              내 서가
            </h1>
            <p className="max-w-2xl font-sans text-lg leading-relaxed text-[#434843]">
              기록되지 않은 삶은 망각의 뒤편으로 사라집니다. 이곳은 단순히 책을
              보관하는 장소가 아니라, 당신의 사유와 시간이 겹겹이 쌓인 사적인
              아카이브입니다.
            </p>
          </section>

          {!emptyLibrary ? (
            <div className="mb-12 space-y-6">
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

          {!emptyLibrary ? (
            <section
              className="mb-12 grid grid-cols-1 gap-4 xl:grid-cols-3"
              aria-label="홈 인사이트 패널"
            >
              <DashboardRecommendationPanel />
              <DashboardReadingEventsCalendar />
            </section>
          ) : null}

          {emptyLibrary ? (
            <Card className="border-dashed border-[#051b0e]/20 bg-white/50">
              <CardHeader>
                <CardTitle className="font-serif text-[#051b0e]">
                  소장 도서가 아직 없습니다
                </CardTitle>
                <CardDescription>
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
            <Card className="border-dashed border-[#051b0e]/20 bg-white/50">
              <CardHeader>
                <CardTitle className="font-serif text-[#051b0e]">
                  검색 결과가 없습니다
                </CardTitle>
                <CardDescription>
                  「{q}」에 맞는 책이 없습니다. 다른 키워드로 시도하거나{" "}
                  <Link
                    href="/dashboard"
                    className="text-[#163826] underline-offset-4 hover:underline"
                  >
                    전체 목록
                  </Link>
                  으로 돌아가 보세요.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {!emptyLibrary && !emptySearch && readingBooks.length > 0 ? (
            <section
              className="mb-20 md:mb-24"
              aria-labelledby="dash-reading-shelf-heading"
            >
              <div className="mb-10 flex items-baseline justify-between md:mb-12">
                <h2
                  id="dash-reading-shelf-heading"
                  className="font-serif text-3xl text-[#051b0e]"
                >
                  현재 읽고 있는 도서
                </h2>
                <Link
                  href={buildDashboardHref({ q, tab: "reading" })}
                  className="font-sans text-xs uppercase tracking-widest text-[#434843] transition-colors hover:text-[#051b0e]"
                >
                  전체 보기
                </Link>
              </div>
              <EditorialGrid books={readingBooks} variant="reading" />
            </section>
          ) : null}

          {!emptyLibrary && !emptySearch ? (
            <div className="space-y-20 md:space-y-32">
              {tab === "reading" ? (
                readingBooks.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[#051b0e]/15 bg-[#f5f3ee]/50 py-10 text-center text-sm text-[#434843]">
                    지금 읽는 책이 없습니다.
                  </p>
                ) : readingTotal > READING_SHELF_LIMIT ? (
                  <p className="text-xs text-[#675d53]">
                    읽는 중인 책이 {readingTotal.toLocaleString("ko-KR")}
                    권입니다. 나머지는 왼쪽 ALL에서 제목·저자 검색으로 찾아
                    보세요.
                  </p>
                ) : null
              ) : null}

              {tab === "unread" ? (
                <section
                  className="space-y-8"
                  aria-labelledby="dash-unread-heading"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                    <h2
                      id="dash-unread-heading"
                      className="font-serif text-3xl text-[#051b0e]"
                    >
                      읽기 전
                    </h2>
                  </div>
                  {unreadBooks.length > 0 ? (
                    <>
                      <EditorialGrid books={unreadBooks} variant="owned" />
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
                    <p className="rounded-lg border border-dashed border-[#051b0e]/15 bg-[#f5f3ee]/50 py-10 text-center text-sm text-[#434843]">
                      {q.length > 0 || genreFilter.length > 0
                        ? "검색·필터에 맞는 책이 없습니다."
                        : "읽기 전 상태인 책이 없습니다."}
                    </p>
                  )}
                </section>
              ) : null}

              {tab === "completed" ? (
                <section
                  className="space-y-8"
                  aria-labelledby="dash-completed-heading"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                    <h2
                      id="dash-completed-heading"
                      className="font-serif text-3xl text-[#051b0e]"
                    >
                      완독
                    </h2>
                  </div>
                  {completedBooks.length > 0 ? (
                    <>
                      <EditorialGrid books={completedBooks} variant="owned" />
                      <DashboardBooksPagination
                        searchQuery={q}
                        page={completedPage}
                        pageSize={PAGE_SIZE}
                        total={completedTotal}
                        tab="completed"
                        sectionLabel="완독"
                      />
                    </>
                  ) : (
                    <p className="rounded-lg border border-dashed border-[#051b0e]/15 bg-[#f5f3ee]/50 py-10 text-center text-sm text-[#434843]">
                      {q.length > 0 || genreFilter.length > 0
                        ? "검색·필터에 맞는 책이 없습니다."
                        : "완독으로 표시된 책이 없습니다."}
                    </p>
                  )}
                </section>
              ) : null}

              {tab === "hall" ? (
                <section
                  className="space-y-8"
                  aria-labelledby="dash-hall-heading"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                    <h2
                      id="dash-hall-heading"
                      className="font-serif text-3xl text-[#051b0e]"
                    >
                      Hall of Fame
                    </h2>
                    <span className="font-sans text-xs uppercase tracking-widest text-[#e9c176]">
                      완독 · 개인 평점 4점 이상
                    </span>
                  </div>
                  {hallBooks.length > 0 ? (
                    <>
                      <EditorialGrid books={hallBooks} variant="owned" />
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
                    <p className="rounded-lg border border-dashed border-[#051b0e]/15 bg-[#f5f3ee]/50 py-10 text-center text-sm text-[#434843]">
                      Hall of Fame(완독·개인 평점 4점 이상)에 해당하는 소장
                      도서가 없습니다.
                    </p>
                  )}
                </section>
              ) : null}

              {tab === "owned" ? (
                <section
                  className="space-y-8"
                  aria-labelledby="dash-owned-heading"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
                    <h2
                      id="dash-owned-heading"
                      className="font-serif text-3xl text-[#051b0e]"
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
                          "font-sans text-xs uppercase tracking-widest transition-colors",
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
                          "font-sans text-xs uppercase tracking-widest transition-colors",
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
                      <EditorialGrid books={ownedBooks} variant="owned" />
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
                    <p className="rounded-lg border border-dashed border-[#051b0e]/15 bg-[#f5f3ee]/50 py-10 text-center text-sm text-[#434843]">
                      {q.length > 0 || genreFilter.length > 0
                        ? "검색·장르 조건에 맞는 도서가 없습니다."
                        : "표시할 소장 도서가 없습니다."}
                    </p>
                  )}
                </section>
              ) : null}
            </div>
          ) : null}
        </main>
      </div>

      {!emptyLibrary ? (
        <Link
          href="/dashboard/books/new"
          className="group fixed bottom-12 right-12 z-50 flex size-16 items-center justify-center rounded-full bg-[#1a3021] text-white shadow-2xl transition-transform hover:scale-110"
          aria-label="새 도서 추가"
        >
          <span className="text-3xl font-light leading-none">+</span>
          <span className="pointer-events-none absolute right-20 whitespace-nowrap rounded-lg bg-[#1a3021] px-4 py-2 font-sans text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">
            새 도서 추가
          </span>
        </Link>
      ) : null}
    </div>
  );
}
