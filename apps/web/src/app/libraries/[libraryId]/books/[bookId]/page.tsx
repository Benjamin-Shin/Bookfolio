import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BookCanonInfoPanel } from "@/components/books/book-canon-info-panel";
import { BookDetailSidecars } from "@/components/books/book-detail-sidecars.client";
import { BookShelfRecordInlineForm } from "@/components/books/book-shelf-record-inline-form.client";
import { CanonPurchaseLinksCard } from "@/components/books/canon-purchase-links.client";
import { UnshareFromLibraryButton } from "@/components/libraries/unshare-from-library-button";
import { Button } from "@/components/ui/button";
import {
  fetchCommunityRatingsByBookIds,
  mergeCommunityRatingsIntoUserBooks,
} from "@/lib/books/book-community-ratings";
import { getUserBookWithCanonical } from "@/lib/books/repository";
import { getLibraryAggregatedBook } from "@/lib/libraries/repository";

type PageProps = {
  params: Promise<{ libraryId: string; bookId: string }>;
};

/**
 * 모임서가에서 연 도서 상세 — 내 소유면 내 서가 상세와 같은 셸·섹션, 아니면 캐논(도서 정보)만.
 *
 * @history
 * - 2026-05-04: 비소장 시에도 공개 한줄평 작성 — `canon-books/[bookId]/my-one-liner`·`BookOneLinersInCanonPanel` 분기
 * - 2026-05-04: 대시보드 도서 상세와 정렬; 비소장 시 캐논 정보+한줄평
 */
export default async function SharedLibraryBookDetailPage({
  params,
}: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { libraryId, bookId } = await params;
  const repoCtx = { userId: session.user.id } as const;

  const agg = await getLibraryAggregatedBook(
    libraryId,
    bookId,
    session.user.id,
    repoCtx,
  );
  if (!agg) {
    notFound();
  }

  const myOwner = agg.owners.find((o) => o.userId === session.user.id);
  const myDetail =
    myOwner != null
      ? await getUserBookWithCanonical(myOwner.userBookId, repoCtx)
      : null;

  const canEditCanon =
    session.user.role === "ADMIN" || session.user.role === "STAFF";

  if (myDetail) {
    const ratings = await fetchCommunityRatingsByBookIds([
      myDetail.userBook.bookId,
    ]);
    const [userBook] = mergeCommunityRatingsIntoUserBooks(
      [myDetail.userBook],
      ratings,
    );
    const displayAuthors = userBook.authors.join(", ");

    return (
      <div className="min-h-screen bg-[#F8F9FA] text-[#1b1c19] selection:bg-[#c5e6d4] selection:text-[#0f241c]">
        <main className="px-4 pb-28 pt-8 md:px-8 md:pb-24 md:pt-10 lg:px-12">
          <div className="mx-auto w-full max-w-6xl">
            <header className="mb-8 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#675d53]">
                  모임서가
                </p>
                <h1 className="font-serif text-3xl text-[#1A3C2F] md:text-4xl">
                  {userBook.title}
                </h1>
                <p className="max-w-2xl text-sm text-[#434843]">
                  {displayAuthors || "저자 미상"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-[#1A3C2F]/25 bg-white/80 text-[#1A3C2F] hover:bg-white"
                >
                  <Link href={`/libraries/${libraryId}` as Route}>
                    모임서가로
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-[#1A3C2F]/25 bg-white/80 text-[#1A3C2F] hover:bg-white"
                >
                  <Link href={`/dashboard/books/${userBook.id}`}>
                    내 서가 상세
                  </Link>
                </Button>
                {canEditCanon ? (
                  <Button
                    size="sm"
                    asChild
                    className="bg-[#1A3C2F] text-white hover:bg-[#1A3C2F]/90"
                  >
                    <Link href={`/dashboard/books/${userBook.id}/edit`}>
                      서지 편집
                    </Link>
                  </Button>
                ) : null}
              </div>
            </header>

            <div className="grid gap-8">
              <BookCanonInfoPanel
                book={{
                  userBookId: userBook.id,
                  bookId: userBook.bookId,
                  title: userBook.title,
                  coverUrl: userBook.coverUrl ?? null,
                  isbn: userBook.isbn ?? null,
                  publisher: userBook.publisher,
                  publishedDate: userBook.publishedDate,
                  priceKrw: userBook.priceKrw,
                  description: userBook.description,
                  catalogSource: userBook.catalogSource ?? null,
                  genreSlugs: userBook.genreSlugs ?? [],
                  communityRatingAvg: userBook.communityRatingAvg ?? null,
                  communityRatingCount: userBook.communityRatingCount,
                }}
              />

              <BookShelfRecordInlineForm
                userBookId={userBook.id}
                userBook={{
                  format: userBook.format,
                  readingStatus: userBook.readingStatus,
                  rating: userBook.rating,
                  location: userBook.location,
                  currentPage: userBook.currentPage ?? null,
                  readingTotalPages: userBook.readingTotalPages ?? null,
                  isOwned: userBook.isOwned,
                }}
              />

              {!userBook.isOwned ? (
                <CanonPurchaseLinksCard bookId={userBook.bookId} />
              ) : null}

              <BookDetailSidecars
                userBookId={userBook.id}
                pageCount={userBook.pageCount ?? null}
                readingTotalPages={userBook.readingTotalPages ?? null}
              />

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
                <p className="text-xs text-muted-foreground">
                  삭제하면 내 서가에서만 제거됩니다.
                </p>
                <form action={`/api/me/books/${userBook.id}`} method="post">
                  <input type="hidden" name="_method" value="DELETE" />
                  <Button type="submit" variant="destructive" size="sm">
                    내 서가에서 삭제
                  </Button>
                </form>
              </div>

              <div className="border-t border-border/60 pt-6">
                <UnshareFromLibraryButton
                  libraryId={libraryId}
                  bookId={bookId}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const ratings = await fetchCommunityRatingsByBookIds([agg.bookId]);
  const cr = ratings.get(agg.bookId);
  const communityRatingAvg =
    cr && cr.count > 0 ? cr.avg : null;
  const communityRatingCount = cr?.count ?? 0;
  const displayAuthors = agg.authors.join(", ");
  const genreSlugs = agg.genreSlugs ?? [];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1b1c19] selection:bg-[#c5e6d4] selection:text-[#0f241c]">
      <main className="px-4 pb-28 pt-8 md:px-8 md:pb-24 md:pt-10 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-8 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#675d53]">
                모임서가
              </p>
              <h1 className="font-serif text-3xl text-[#1A3C2F] md:text-4xl">
                {agg.title}
              </h1>
              <p className="max-w-2xl text-sm text-[#434843]">
                {displayAuthors || "저자 미상"}
              </p>
              <p className="text-xs text-[#675d53]">
                내 서가에 없는 도서입니다. 도서 정보와 공개 한줄평을 이용할 수
                있습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-[#1A3C2F]/25 bg-white/80 text-[#1A3C2F] hover:bg-white"
              >
                <Link href={`/libraries/${libraryId}` as Route}>
                  모임서가로
                </Link>
              </Button>
              {session.user.role === "ADMIN" ? (
                <Button
                  size="sm"
                  asChild
                  className="bg-[#1A3C2F] text-white hover:bg-[#1A3C2F]/90"
                >
                  <Link href={`/admin/books/${agg.bookId}/edit`}>
                    서지 편집
                  </Link>
                </Button>
              ) : null}
            </div>
          </header>

          <BookCanonInfoPanel
            book={{
              userBookId: "",
              bookId: agg.bookId,
              title: agg.title,
              coverUrl: agg.coverUrl,
              isbn: agg.isbn,
              publisher: agg.publisher,
              publishedDate: agg.publishedDate,
              priceKrw: agg.priceKrw,
              description: agg.description,
              catalogSource: agg.catalogSource,
              genreSlugs,
              communityRatingAvg,
              communityRatingCount,
            }}
            canManageOneLiners
          />
        </div>
      </main>
    </div>
  );
}
