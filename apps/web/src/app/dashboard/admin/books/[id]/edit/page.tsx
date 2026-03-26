import { notFound } from "next/navigation";

import { AdminEditBookPageClient } from "../../admin-edit-book-page-client";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * 관리자 도서 수정 페이지에서 로드하는 `books` 행.
 *
 * @history
 * - 2026-03-26: `page_count` 로드·폼 기본값
 * - 2026-03-26: 상·하단 저장·목록 툴바 — `AdminEditBookPageClient`로 이전
 * - 2026-03-24: `translators`, `api_source` 추가
 */
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

export default async function AdminEditBookPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const supabase = createSupabaseAdminClient();
  const { data: row, error } = await supabase
    .from("books")
    .select(
      "id,isbn,title,authors,translators,source,api_source,price_krw,page_count,genre_slugs,literature_region,original_language,publisher,published_date,cover_url,description"
    )
    .eq("id", id)
    .single();

  if (error || !row) {
    notFound();
  }

  const book = row as BookRow;
  const translators = Array.isArray(book.translators) ? book.translators : [];

  const { data: refRows } = await supabase.from("user_books").select("is_owned").eq("book_id", id);

  let totalRefs = 0;
  let ownedRefs = 0;
  for (const r of refRows ?? []) {
    totalRefs += 1;
    if (r.is_owned) ownedRefs += 1;
  }

  const deleteDisabled = totalRefs > 0;
  const deleteTitle =
    ownedRefs > 0
      ? "사용자 소장 서재에 포함된 도서는 삭제할 수 없습니다."
      : "사용자 서재(읽는 중 등)에 연결된 도서는 삭제할 수 없습니다.";

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
    apiSource: book.api_source ?? ""
  };

  return (
    <AdminEditBookPageClient
      book={{
        id: book.id,
        title: book.title,
        source: book.source,
        api_source: book.api_source
      }}
      metaLine={{ totalRefs, ownedRefs }}
      defaultValues={defaultValues}
      deleteDisabled={deleteDisabled}
      deleteTitle={deleteTitle}
    />
  );
}
