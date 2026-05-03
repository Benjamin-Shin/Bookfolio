import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { BookCanonInfoPanel } from "@/components/books/book-canon-info-panel";
import { BookDetailSidecars } from "@/components/books/book-detail-sidecars.client";
import { BookShelfRecordInlineForm } from "@/components/books/book-shelf-record-inline-form.client";
import { CanonPurchaseLinksCard } from "@/components/books/canon-purchase-links.client";
import { Button } from "@/components/ui/button";
import {
  fetchCommunityRatingsByBookIds,
  mergeCommunityRatingsIntoUserBooks,
} from "@/lib/books/book-community-ratings";
import { getUserBookWithCanonical } from "@/lib/books/repository";

/**
 * 내 서가 도서 상세.
 *
 * @history
 * - 2026-04-08: 비소장 시 `CanonPurchaseLinksCard`(캐논 구매 링크·커뮤니티 한줄평)
 * - 2026-03-26: 마크다운 메모·독서 이벤트(`BookDetailSidecars`); 한줄평은 캐논 패널로 이전(2026-05-03); `user_books.memo` 제거 반영
 * - 2026-03-24: 헤더에 장르 배지(이후 2026-05-03 `BookCanonInfoPanel`로 이전)
 * - 2026-05-03: 내 서가 대시보드와 동일 셸·`max-w-6xl`·`<header>` 타이틀 블록으로 정렬
 * - 2026-05-03: 도서 정보는 `BookCanonInfoPanel`; 내 서가 기록은 `BookShelfRecordInlineForm`만(조회·수정 동일 섹션)
 * - 2026-05-03: 장르·회원 평균 평점은 `BookCanonInfoPanel`, 헤더는 제목·저자·버튼만
 * - 2026-05-03: 상세 로드 시 `fetchCommunityRatingsByBookIds`로 회원 평균 별점 병합
 * - 2026-05-03: `user_books` 인라인 편집·스태프만 `/dashboard/books/:id/edit`(캐논)
 */
export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getUserBookWithCanonical(id);

  if (!row) {
    notFound();
  }

  const ratings = await fetchCommunityRatingsByBookIds([row.userBook.bookId]);
  const [userBook] = mergeCommunityRatingsIntoUserBooks(
    [row.userBook],
    ratings,
  );
  const displayTitle = userBook.title;
  const displayAuthors = userBook.authors.join(", ");
  const session = await auth();
  const canEditCanon =
    session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1b1c19] selection:bg-[#c5e6d4] selection:text-[#0f241c]">
      <main className="px-4 pb-28 pt-8 md:px-8 md:pb-24 md:pt-10 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-8 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#675d53]">
                My Library
              </p>
              <h1 className="font-serif text-3xl text-[#1A3C2F] md:text-4xl">
                {displayTitle}
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
                <Link href="/dashboard">목록으로</Link>
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
          </div>
        </div>
      </main>
    </div>
  );
}
