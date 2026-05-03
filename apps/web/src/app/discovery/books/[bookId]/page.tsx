import { notFound, redirect } from "next/navigation";
import type { Route } from "next";

import { auth } from "@/auth";
import { DiscoveryCanonBookDetailView } from "@/components/discovery/discovery-canon-book-detail";
import { fetchCommunityRatingsByBookIds } from "@/lib/books/book-community-ratings";
import { getCanonicalBookById } from "@/lib/books/repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ bookId: string }>;
};

/**
 * 캐논 `books.id`로 발견 상세 — 도서 정보 및 공개 한줄평만.
 *
 * @history
 * - 2026-05-04: 신규 (`/discovery/books/[bookId]`)
 */
export default async function DiscoveryCanonByIdPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { bookId } = await params;
  const canon = await getCanonicalBookById(bookId, { userId: session.user.id });
  if (!canon) {
    notFound();
  }

  const ratings = await fetchCommunityRatingsByBookIds([canon.id]);
  const cr = ratings.get(canon.id);
  const communityRatingAvg = cr && cr.count > 0 ? cr.avg : null;
  const communityRatingCount = cr?.count ?? 0;

  return (
    <DiscoveryCanonBookDetailView
      canon={canon}
      communityRatingAvg={communityRatingAvg}
      communityRatingCount={communityRatingCount}
      backHref={"/discovery" as Route}
      backLabel="발견으로"
    />
  );
}
