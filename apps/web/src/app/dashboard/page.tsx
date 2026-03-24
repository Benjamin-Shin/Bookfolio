import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Bookshelf, BOOKS_PER_SHELF } from "@/components/books/bookshelf";
import {
  DashboardBooksToolbar,
  DashboardOwnedBooksPagination,
} from "@/components/dashboard/dashboard-books-toolbar";
import { DashboardOwnedGenreFilter } from "@/components/dashboard/dashboard-owned-genre-filter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getUserOwnedBooksPriceStats,
  listUserBooksPaged,
  listUserOwnedGenreSlugs,
} from "@/lib/books/repository";

const PAGE_SIZE = BOOKS_PER_SHELF;
const READING_SHELF_LIMIT = 50;

type DashboardPageProps = {
  searchParams: Promise<{ q?: string; page?: string; genre?: string }>;
};

/**
 * 로그인 사용자의 읽는 중·소장 책장.
 *
 * @history
 * - 2026-03-24: 소장 장르 필터(`genre` 쿼리, `listUserOwnedGenreSlugs`·RPC `p_genre_slug`)
 * - 2026-03-24: `PAGE_SIZE` = `BOOKS_PER_SHELF` import(선반 줄 수·한 줄 권수 상수와 동기)
 * - 2026-03-24: 소장 총권수 보정·소장 하단 페이지네이션(`DashboardOwnedBooksPagination`)
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
  const pageRaw = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const ctx = { userId: session.user.id, useAdmin: true } as const;
  const searchOpt = q ? q : undefined;
  const genreSlugOpt = genreFilter ? genreFilter : undefined;

  const [libraryProbe, readingRes, ownedRes, priceStats, ownedGenres] =
    await Promise.all([
      listUserBooksPaged({ limit: 1, offset: 0 }, ctx),
      listUserBooksPaged(
        {
          readingStatus: "reading",
          search: searchOpt,
          limit: READING_SHELF_LIMIT,
          offset: 0,
        },
        ctx,
      ),
      listUserBooksPaged(
        {
          isOwned: true,
          search: searchOpt,
          genreSlug: genreSlugOpt,
          limit: PAGE_SIZE,
          offset: (pageRaw - 1) * PAGE_SIZE,
        },
        ctx,
      ),
      getUserOwnedBooksPriceStats(ctx),
      listUserOwnedGenreSlugs(ctx),
    ]);

  const libraryTotal = libraryProbe.total;
  const readingBooks = readingRes.items;
  const readingTotal = readingRes.total;
  const ownedBooks = ownedRes.items;
  /** 검색·장르 필터 없을 때 RPC total이 실제 소장 권수보다 작게 올 때 페이지네이션이 사라지는 경우 보정 */
  const ownedTotalForPager =
    q.length > 0 || genreFilter.length > 0
      ? ownedRes.total
      : Math.max(ownedRes.total, priceStats.ownedCount);

  const ownedTotalPages = Math.max(
    1,
    Math.ceil(ownedTotalForPager / PAGE_SIZE),
  );
  const ownedPage =
    ownedTotalForPager === 0 ? 1 : Math.min(pageRaw, ownedTotalPages);

  if (ownedTotalForPager > 0 && pageRaw > ownedTotalPages) {
    const np = new URLSearchParams();
    if (q) np.set("q", q);
    if (genreFilter) np.set("genre", genreFilter);
    np.set("page", String(ownedTotalPages));
    redirect(`/dashboard?${np.toString()}`);
  }

  const emptyLibrary = libraryTotal === 0 && !q;
  const emptySearch =
    libraryTotal > 0 && q && readingTotal === 0 && ownedRes.total === 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit border-border/80 lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle className="text-lg">내 서재</CardTitle>
            <CardDescription className="break-all">
              {session.user.email ?? session.user.name ?? "로그인됨"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" asChild>
              <Link href={"/dashboard/libraries" as Route}>공동서재</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/books/new">책 추가하기</Link>
            </Button>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" className="w-full">
                로그아웃
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Dashboard
              </p>
              <h1 className="text-3xl font-bold tracking-tight">내 책장</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                읽는 중인 책과 소장 책을 나눠 보여 줍니다. 같은 책이 두 곳에
                있을 수 있어요(소장하면서 읽는 중). 표지를 누르면 상세·수정으로
                이동합니다.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/books/new">수동 등록</Link>
            </Button>
          </div>

          {!emptyLibrary ? (
            <DashboardBooksToolbar
              searchQuery={q}
              page={ownedPage}
              pageSize={PAGE_SIZE}
              ownedTotal={ownedTotalForPager}
              readingTotal={readingTotal}
              genreSlug={genreFilter}
            />
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
            <div className="space-y-12">
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
                    읽기 상태를 「읽는 중」으로 바꾸면 이 선반에 모입니다. 최대{" "}
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

              <section
                className="space-y-3"
                aria-labelledby="dash-owned-heading"
              >
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
                    <DashboardOwnedBooksPagination
                      searchQuery={q}
                      page={ownedPage}
                      pageSize={PAGE_SIZE}
                      ownedTotal={ownedTotalForPager}
                      genreSlug={genreFilter}
                    />
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 py-10 text-center text-sm text-muted-foreground">
                    {priceStats.ownedCount > 0 && (q.length > 0 || genreFilter.length > 0)
                      ? "검색·장르 조건에 맞는 소장 도서가 없습니다."
                      : "소장으로 표시된 책이 없습니다. 책 수정에서 「소장 중」을 켜 보세요."}
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
