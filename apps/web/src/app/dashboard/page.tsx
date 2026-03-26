import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Bookshelf, BOOKS_PER_SHELF } from "@/components/books/bookshelf";
import {
  DashboardBooksPagination,
  DashboardBooksToolbar,
} from "@/components/dashboard/dashboard-books-toolbar";
import { DashboardOwnedGenreFilter } from "@/components/dashboard/dashboard-owned-genre-filter";
import { DashboardReadingEventsCalendar } from "@/components/dashboard/dashboard-reading-events-calendar.client";
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
  parseDashboardTab,
  type DashboardTab,
} from "@/lib/dashboard/dashboard-href";
import { cn } from "@/lib/utils";
import {
  getUserOwnedBooksPriceStats,
  listUserBooksPaged,
  listUserOwnedGenreSlugs,
} from "@/lib/books/repository";

const PAGE_SIZE = BOOKS_PER_SHELF;
const READING_SHELF_LIMIT = 50;

type DashboardPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    genre?: string;
    tab?: string;
  }>;
};

const TAB_LABEL: Record<DashboardTab, string> = {
  reading: "읽는 중",
  unread: "읽기 전",
  completed: "완독",
  owned: "소장",
};

/**
 * 로그인 사용자의 읽는 중·소장 책장.
 *
 * @history
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
  const pageRaw = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const ctx = { userId: session.user.id, useAdmin: true } as const;
  const searchOpt = q ? q : undefined;
  const genreSlugOpt = genreFilter ? genreFilter : undefined;

  const [
    libraryProbe,
    statReading,
    statUnread,
    statCompleted,
    priceStats,
    searchProbeRes,
  ] = await Promise.all([
    listUserBooksPaged({ limit: 1, offset: 0 }, ctx),
    listUserBooksPaged(
      { readingStatus: "reading", limit: 1, offset: 0 },
      ctx,
    ),
    listUserBooksPaged(
      { readingStatus: "unread", limit: 1, offset: 0 },
      ctx,
    ),
    listUserBooksPaged(
      { readingStatus: "completed", limit: 1, offset: 0 },
      ctx,
    ),
    getUserOwnedBooksPriceStats(ctx),
    q
      ? listUserBooksPaged(
          { limit: 1, offset: 0, search: searchOpt },
          ctx,
        )
      : Promise.resolve({ total: 0, items: [] as never[] }),
  ]);

  const libraryTotalAll = libraryProbe.total;

  if (tab === "reading" && pageRaw > 1) {
    redirect(
      buildDashboardHref({ q, genre: genreFilter, page: 1, tab: "reading" }),
    );
  }

  const readingListP =
    tab === "reading"
      ? listUserBooksPaged(
          {
            readingStatus: "reading",
            search: searchOpt,
            limit: READING_SHELF_LIMIT,
            offset: 0,
          },
          ctx,
        )
      : Promise.resolve({
          items: [] as Awaited<
            ReturnType<typeof listUserBooksPaged>
          >["items"],
          total: statReading.total,
        });

  const unreadListP =
    tab === "unread"
      ? listUserBooksPaged(
          {
            readingStatus: "unread",
            search: searchOpt,
            limit: PAGE_SIZE,
            offset: (pageRaw - 1) * PAGE_SIZE,
          },
          ctx,
        )
      : Promise.resolve({
          items: [] as Awaited<
            ReturnType<typeof listUserBooksPaged>
          >["items"],
          total: statUnread.total,
        });

  const completedListP =
    tab === "completed"
      ? listUserBooksPaged(
          {
            readingStatus: "completed",
            search: searchOpt,
            limit: PAGE_SIZE,
            offset: (pageRaw - 1) * PAGE_SIZE,
          },
          ctx,
        )
      : Promise.resolve({
          items: [] as Awaited<
            ReturnType<typeof listUserBooksPaged>
          >["items"],
          total: statCompleted.total,
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
          },
          ctx,
        )
      : listUserBooksPaged(
          {
            isOwned: true,
            search: searchOpt,
            limit: 1,
            offset: 0,
          },
          ctx,
        );

  const [readingRes, unreadRes, completedRes, ownedRes, ownedGenres] =
    await Promise.all([
      readingListP,
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

  const ownedTotalForPager =
    q.length > 0 || genreFilter.length > 0
      ? ownedRes.total
      : Math.max(ownedRes.total, priceStats.ownedCount);

  const ownedTotalPages = Math.max(
    1,
    Math.ceil(ownedTotalForPager / PAGE_SIZE),
  );
  const unreadTotalPages = Math.max(
    1,
    Math.ceil(unreadTotal / PAGE_SIZE),
  );
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

  if (tab === "owned" && ownedTotalForPager > 0 && pageRaw > ownedTotalPages) {
    const np = new URLSearchParams();
    if (q) np.set("q", q);
    if (genreFilter) np.set("genre", genreFilter);
    np.set("tab", "owned");
    np.set("page", String(ownedTotalPages));
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

  const emptyLibrary = libraryTotalAll === 0 && !q;
  const emptySearch =
    !emptyLibrary &&
    q.length > 0 &&
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
  } else {
    listTotalForToolbar = ownedTotalForPager;
    toolbarPage = ownedPage;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Dashboard
            </p>
            <h1 className="text-3xl font-bold tracking-tight">내 서재</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              탭으로 읽기 상태·소장을 바꿔 보세요. 표지를 누르면 상세·수정으로
              이동합니다.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/books/new">책 추가하기</Link>
          </Button>
        </div>

        {!emptyLibrary ? (
          <section aria-label="서재 요약">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-xl border border-border/80 bg-card px-4 py-3 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground">
                  전체 등록
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                  {libraryTotalAll.toLocaleString("ko-KR")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">권</p>
              </div>
              {(
                [
                  ["reading", statReading.total],
                  ["unread", statUnread.total],
                  ["completed", statCompleted.total],
                  ["owned", priceStats.ownedCount],
                ] as const
              ).map(([key, count]) => {
                const t = key;
                const active = tab === t;
                return (
                  <Link
                    key={t}
                    href={buildDashboardHref({
                      q,
                      tab: t,
                      ...(t === "owned" ? { genre: genreFilter } : {}),
                    })}
                    className={cn(
                      "rounded-xl border px-4 py-3 shadow-sm transition-colors",
                      active
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/80 bg-card hover:bg-muted/40",
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      {TAB_LABEL[t]}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                      {count.toLocaleString("ko-KR")}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">권</p>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {!emptyLibrary ? (
          <>
            <nav
              className="flex flex-wrap gap-2 border-b border-border/80 pb-1"
              aria-label="서재 탭"
            >
              {(
                ["reading", "unread", "completed", "owned"] as const
              ).map((t) => {
                const active = tab === t;
                return (
                  <Link
                    key={t}
                    href={buildDashboardHref({
                      q,
                      tab: t,
                      ...(t === "owned" ? { genre: genreFilter } : {}),
                    })}
                    className={cn(
                      "relative rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {TAB_LABEL[t]}
                  </Link>
                );
              })}
            </nav>

            <DashboardBooksToolbar
              searchQuery={q}
              page={toolbarPage}
              pageSize={
                tab === "reading" ? READING_SHELF_LIMIT : PAGE_SIZE
              }
              listTotal={listTotalForToolbar}
              currentTab={tab}
              genreSlug={genreFilter}
              renderedCount={
                tab === "reading" ? readingBooks.length : undefined
              }
            />
          </>
        ) : null}

        {!emptyLibrary && priceStats.ownedCount > 0 ? (
          <div className="rounded-lg border border-border/80 bg-muted/25 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">소장 책 가격 합계</p>
            <p className="mt-1 text-muted-foreground">
              {priceStats.pricedOwnedCount > 0 ? (
                <>
                  소장 {priceStats.ownedCount.toLocaleString("ko-KR")}권 중{" "}
                  {priceStats.pricedOwnedCount.toLocaleString("ko-KR")}권에
                  가격이 있어요.{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {priceStats.totalKrw.toLocaleString("ko-KR")}원
                  </span>
                </>
              ) : (
                <>
                  소장 {priceStats.ownedCount.toLocaleString("ko-KR")}권 — 책
                  등록·수정에서 가격(원)을 넣으면 여기에 합계가 표시됩니다.
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              제공처·시점에 따라 실제 구매가와 다를 수 있는 참고 값입니다.
            </p>
          </div>
        ) : null}

        {emptyLibrary ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>아직 등록한 책이 없습니다</CardTitle>
              <CardDescription>
                첫 책을 추가해 Bookfolio를 시작해 보세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/books/new">책 등록하기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {emptySearch ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>검색 결과가 없습니다</CardTitle>
              <CardDescription>
                「{q}」에 맞는 책이 없습니다. 다른 키워드로 시도하거나{" "}
                <Link
                  href="/dashboard"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  전체 목록
                </Link>
                으로 돌아가 보세요.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!emptyLibrary && !emptySearch ? (
          <div className="space-y-6">
            {tab === "reading" ? (
              <section
                className="space-y-3"
                aria-labelledby="dash-reading-heading"
              >
                <div>
                  <h2
                    id="dash-reading-heading"
                    className="text-lg font-semibold tracking-tight"
                  >
                    읽는 중
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    읽기 상태를 「읽는 중」으로 바꾸면 여기에 모입니다. 최대{" "}
                    {READING_SHELF_LIMIT}권까지 한 번에 보여 줍니다.
                  </p>
                </div>
                {readingTotal > READING_SHELF_LIMIT ? (
                  <p className="text-xs text-muted-foreground">
                    읽는 중인 책이 {readingTotal.toLocaleString("ko-KR")}
                    권입니다. 나머지는 검색으로 찾아 보세요.
                  </p>
                ) : null}
                {readingBooks.length > 0 ? (
                  <Bookshelf variant="reading" books={readingBooks} />
                ) : (
                  <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 py-10 text-center text-sm text-muted-foreground">
                    지금 읽는 책이 없습니다.
                  </div>
                )}
              </section>
            ) : null}

            {tab === "unread" ? (
              <section className="space-y-3" aria-labelledby="dash-unread-heading">
                <div>
                  <h2
                    id="dash-unread-heading"
                    className="text-lg font-semibold tracking-tight"
                  >
                    읽기 전
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    아직 읽기 시작 전인 도서입니다.
                  </p>
                </div>
                {unreadBooks.length > 0 ? (
                  <>
                    <Bookshelf variant="owned" books={unreadBooks} />
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
                  <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 py-10 text-center text-sm text-muted-foreground">
                    {q.length > 0 || genreFilter.length > 0
                      ? "검색·필터에 맞는 책이 없습니다."
                      : "읽기 전 상태인 책이 없습니다."}
                  </div>
                )}
              </section>
            ) : null}

            {tab === "completed" ? (
              <section
                className="space-y-3"
                aria-labelledby="dash-completed-heading"
              >
                <div>
                  <h2
                    id="dash-completed-heading"
                    className="text-lg font-semibold tracking-tight"
                  >
                    완독
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    읽기 상태가 「완독」인 도서입니다.
                  </p>
                </div>
                {completedBooks.length > 0 ? (
                  <>
                    <Bookshelf variant="owned" books={completedBooks} />
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
                  <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 py-10 text-center text-sm text-muted-foreground">
                    {q.length > 0 || genreFilter.length > 0
                      ? "검색·필터에 맞는 책이 없습니다."
                      : "완독으로 표시된 책이 없습니다."}
                  </div>
                )}
              </section>
            ) : null}

            {tab === "owned" ? (
              <section className="space-y-3" aria-labelledby="dash-owned-heading">
                <div>
                  <h2
                    id="dash-owned-heading"
                    className="text-lg font-semibold tracking-tight"
                  >
                    소장
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    「소장 중」으로 표시된 책입니다. 아래 페이지 넘김은 소장
                    책만 기준입니다.
                  </p>
                </div>
                <DashboardOwnedGenreFilter
                  genres={ownedGenres}
                  selectedGenre={genreFilter}
                  searchQuery={q}
                />
                {ownedBooks.length > 0 ? (
                  <>
                    <Bookshelf variant="owned" books={ownedBooks} />
                    <DashboardBooksPagination
                      searchQuery={q}
                      page={ownedPage}
                      pageSize={PAGE_SIZE}
                      total={ownedTotalForPager}
                      genreSlug={genreFilter}
                      tab="owned"
                      sectionLabel="소장"
                    />
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 py-10 text-center text-sm text-muted-foreground">
                    {priceStats.ownedCount > 0 &&
                    (q.length > 0 || genreFilter.length > 0)
                      ? "검색·장르 조건에 맞는 소장 도서가 없습니다."
                      : "소장으로 표시된 책이 없습니다. 책 수정에서 「소장 중」을 켜 보세요."}
                  </div>
                )}
              </section>
            ) : null}
          </div>
        ) : null}

        <section className="space-y-3" aria-label="독서 이벤트 캘린더">
          <DashboardReadingEventsCalendar />
        </section>
      </div>
    </main>
  );
}
