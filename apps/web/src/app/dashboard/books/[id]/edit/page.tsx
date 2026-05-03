import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminEditBookPageClient } from "@/app/admin/books/admin-edit-book-page-client";
import { Button } from "@/components/ui/button";
import { requireStaffOrAdmin } from "@/lib/auth/require-staff-or-admin";
import { getUserBookWithCanonical } from "@/lib/books/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type BookRow = {
  id: string;
  isbn: string | null;
  title: string;
  authors: string[];
  translators: string[];
  source: string;
  api_source: string | null;
  price_krw: number | null;
  page_count: number | null;
  genre_slugs: string[] | null;
  literature_region: string | null;
  original_language: string | null;
  publisher: string | null;
  published_date: string | null;
  cover_url: string | null;
  description: string | null;
};

/**
 * 스태프·관리자 전용 — 연결된 공유 서지(`books`) 캐논 편집.
 * 일반 회원의 `user_books` 수정은 도서 상세 화면에서 합니다.
 *
 * @history
 * - 2026-05-03: 내 서가 기록 폼과 분리·`requireStaffOrAdmin`·`AdminEditBookPageClient` 재사용
 * - 2026-05-03: 내 서가 대시보드와 동일 셸·`max-w-6xl`·`<header>` 타이틀 블록으로 정렬
 */
export default async function DashboardStaffCanonEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStaffOrAdmin();
  const { id: userBookId } = await params;

  const row = await getUserBookWithCanonical(userBookId, {
    userId: session.user.id,
    useAdmin: true,
  });
  if (!row) {
    notFound();
  }

  const { userBook } = row;
  const bookId = userBook.bookId?.trim();
  if (!bookId) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const { data: canonRow, error } = await supabase
    .from("books")
    .select(
      "id,isbn,title,authors,translators,source,api_source,price_krw,page_count,genre_slugs,literature_region,original_language,publisher,published_date,cover_url,description",
    )
    .eq("id", bookId)
    .single();

  if (error || !canonRow) {
    notFound();
  }

  const book = canonRow as BookRow;
  const translators = Array.isArray(book.translators) ? book.translators : [];

  const { data: refRows } = await supabase
    .from("user_books")
    .select("is_owned")
    .eq("book_id", bookId);

  let totalRefs = 0;
  let ownedRefs = 0;
  for (const r of refRows ?? []) {
    totalRefs += 1;
    if (r.is_owned) ownedRefs += 1;
  }

  const deleteDisabled = totalRefs > 0;
  const deleteTitle =
    ownedRefs > 0
      ? "사용자 소장 서가에 포함된 도서는 삭제할 수 없습니다."
      : "사용자 서가(읽는 중 등)에 연결된 도서는 삭제할 수 없습니다.";

  const defaultValues = {
    title: book.title,
    authorsCsv: (book.authors ?? []).join(", "),
    translatorsCsv: translators.join(", "),
    isbn: book.isbn ?? "",
    publisher: book.publisher ?? "",
    publishedDate: book.published_date ?? "",
    coverUrl: book.cover_url ?? "",
    description: book.description ?? "",
    priceKrw: book.price_krw != null ? String(book.price_krw) : "",
    pageCount: book.page_count != null ? String(book.page_count) : "",
    genreSlugs: (book.genre_slugs ?? []).join(", "),
    literatureRegion: book.literature_region ?? "",
    originalLanguage: book.original_language ?? "",
    apiSource: book.api_source ?? "",
  };

  const detailHref = `/dashboard/books/${userBookId}` as Route;
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1b1c19] selection:bg-[#c5e6d4] selection:text-[#0f241c]">
      <main className="px-4 pb-28 pt-8 md:px-8 md:pb-24 md:pt-10 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-8 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#675d53]">
                  Staff · Catalog
                </p>
                <h1 className="font-serif text-3xl text-[#1A3C2F] md:text-4xl">
                  공유 서지(캐논) 편집
                </h1>
                <p className="max-w-2xl text-sm text-[#434843]">
                  「{userBook.title}」에 연결된 서지 레코드를 수정합니다. 저장 시 같은
                  ISBN·서지를 쓰는 모든 회원에게 반영됩니다.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full shrink-0 border-[#1A3C2F]/25 bg-white/80 text-[#1A3C2F] hover:bg-white sm:w-auto"
              >
                <Link href={detailHref}>내 서가 상세로</Link>
              </Button>
            </div>
          </header>

          <AdminEditBookPageClient
            book={{
              id: book.id,
              title: book.title,
              source: book.source,
              api_source: book.api_source,
            }}
            metaLine={{ totalRefs, ownedRefs }}
            defaultValues={defaultValues}
            deleteDisabled={deleteDisabled}
            deleteTitle={deleteTitle}
            toolbarBackHref={detailHref}
            toolbarBackLabel="상세로"
            pageHeading="공유 서지(캐논) 편집"
            showCatalogDelete={isAdmin}
          />
        </div>
      </main>
    </div>
  );
}
