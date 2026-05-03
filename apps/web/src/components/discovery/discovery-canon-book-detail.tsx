import Link from "next/link";
import type { Route } from "next";

import { BookCanonInfoPanel } from "@/components/books/book-canon-info-panel";
import { Button } from "@/components/ui/button";
import { normalizeCoverUrlForClient } from "@/lib/books/cover-url";
import type { DbCanonicalBook } from "@/lib/books/repository";

/**
 * 발견 플로우용 — 내 서가 기록 없이 공유 서지·한줄평만.
 *
 * @history
 * - 2026-05-04: `/discovery/books/:id`, `by-isbn` 공용
 */
export function DiscoveryCanonBookDetailView({
  canon,
  communityRatingAvg,
  communityRatingCount,
  backHref,
  backLabel,
}: {
  canon: DbCanonicalBook;
  communityRatingAvg: number | null;
  communityRatingCount: number;
  backHref: Route;
  backLabel: string;
}) {
  const genreSlugs = Array.isArray(canon.genre_slugs) ? canon.genre_slugs : [];
  const authors = Array.isArray(canon.authors) ? canon.authors : [];
  const displayAuthors = authors.join(", ");

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1b1c19] selection:bg-[#c5e6d4] selection:text-[#0f241c]">
      <main className="px-4 pb-28 pt-8 md:px-8 md:pb-24 md:pt-10 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-8 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#675d53]">
                Discovery
              </p>
              <h1 className="font-serif text-3xl text-[#1A3C2F] md:text-4xl">
                {canon.title.trim() || "제목 미상"}
              </h1>
              <p className="max-w-2xl text-sm text-[#434843]">
                {displayAuthors || "저자 미상"}
              </p>
              <p className="max-w-2xl text-xs text-[#675d53]">
                서가 공유 서지를 기준으로 표시합니다. 내 서가에 담으면 진행 상태·메모 등을 추가로 기록할 수 있습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-[#1A3C2F]/25 bg-white/80 text-[#1A3C2F] hover:bg-white"
              >
                <Link href={backHref}>{backLabel}</Link>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                asChild
                className="bg-white text-[#1A3C2F] ring-1 ring-[#1A3C2F]/20 hover:bg-[#fbf9f4]"
              >
                <Link href={"/dashboard/books/new" as Route}>내 서가에 담기</Link>
              </Button>
            </div>
          </header>

          <BookCanonInfoPanel
            book={{
              userBookId: "",
              bookId: canon.id,
              title: canon.title,
              coverUrl: normalizeCoverUrlForClient(canon.cover_url),
              isbn: canon.isbn ?? null,
              publisher: canon.publisher,
              publishedDate: canon.published_date,
              priceKrw: canon.price_krw ?? null,
              description: canon.description ?? null,
              catalogSource: canon.source ?? null,
              genreSlugs,
              communityRatingAvg,
              communityRatingCount,
            }}
            canManageOneLiners
            pendingLabel="준비중"
          />
        </div>
      </main>
    </div>
  );
}
