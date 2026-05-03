import { redirect } from "next/navigation";
import type { Route } from "next";

import { auth } from "@/auth";
import { DiscoveryCanonBookDetailView } from "@/components/discovery/discovery-canon-book-detail";
import {
  DiscoveryIsbnHydrationError,
  loadOrCreateCanonBookForDiscoveryByIsbn,
} from "@/lib/discovery/ensure-canon-for-discovery";
import { fetchCommunityRatingsByBookIds } from "@/lib/books/book-community-ratings";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ isbn: string }>;
};

/**
 * ISBN으로 들어오는 발견 상세 — `books` 미등록 시 Open API 조회 후 upsert.
 *
 * @history
 * - 2026-05-04: 신규 (`/discovery/books/by-isbn/[isbn]`)
 */
export default async function DiscoveryCanonByIsbnPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const rawSeg = decodeURIComponent((await params).isbn ?? "").trim();

  let bookPayload: Awaited<ReturnType<typeof loadOrCreateCanonBookForDiscoveryByIsbn>>;
  try {
    bookPayload = await loadOrCreateCanonBookForDiscoveryByIsbn(rawSeg);
  } catch (e) {
    const msg =
      e instanceof DiscoveryIsbnHydrationError
        ? e.message
        : e instanceof Error
          ? e.message
          : "도서를 불러오지 못했습니다.";
    return (
      <main className="min-h-screen bg-[#F8F9FA] px-4 pb-28 pt-8 text-[#1b1c19] md:px-8 md:pt-10">
        <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-destructive/25 bg-white/90 p-6 shadow-sm">
          <h1 className="font-serif text-xl text-[#1A3C2F]">표시할 수 없습니다</h1>
          <p className="text-sm text-[#434843]">{msg}</p>
          <Button variant="outline" asChild>
            <Link href={"/discovery" as Route}>발견으로</Link>
          </Button>
        </div>
      </main>
    );
  }

  const ratings = await fetchCommunityRatingsByBookIds([bookPayload.book.id]);
  const cr = ratings.get(bookPayload.book.id);
  const communityRatingAvg = cr && cr.count > 0 ? cr.avg : null;
  const communityRatingCount = cr?.count ?? 0;

  return (
    <DiscoveryCanonBookDetailView
      canon={bookPayload.book}
      communityRatingAvg={communityRatingAvg}
      communityRatingCount={communityRatingCount}
      backHref={"/discovery" as Route}
      backLabel="발견으로"
    />
  );
}
