import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

import { AdminBookDeleteForm } from "../../admin-book-delete-form";
import { AdminCanonicalBookForm } from "../../admin-canonical-book-form";

/**
 * 관리자 도서 수정 페이지에서 로드하는 `books` 행.
 *
 * @history
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
      "id,isbn,title,authors,translators,source,api_source,price_krw,genre_slugs,literature_region,original_language,publisher,published_date,cover_url,description"
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
    genreSlugs: (book.genre_slugs ?? []).join(", "),
    literatureRegion: book.literature_region ?? "",
    originalLanguage: book.original_language ?? "",
    apiSource: book.api_source ?? ""
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">도서 수정</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            카탈로그 출처: <span className="font-mono text-xs">{book.source}</span>
            {book.api_source ? (
              <>
                {" "}
                · API소스: <span className="font-mono text-xs">{book.api_source}</span>
              </>
            ) : null}
            {totalRefs > 0 ? (
              <>
                {" "}
                · 서재 연결 {totalRefs}건
                {ownedRefs > 0 ? ` (소장 ${ownedRefs}건)` : null}
              </>
            ) : null}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/admin/books">목록으로</Link>
        </Button>
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>{book.title}</CardTitle>
          <CardDescription>공유 서지 필드를 수정합니다. 연결된 모든 사용자에게 반영됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <AdminCanonicalBookForm mode="edit" bookId={book.id} defaultValues={defaultValues} />

          <Separator />

          <div className="space-y-2">
            <h2 className="text-sm font-medium">삭제</h2>
            <p className="text-xs text-muted-foreground">
              {deleteDisabled
                ? deleteTitle
                : "서재에 연결된 기록이 없을 때만 삭제할 수 있습니다."}
            </p>
            <AdminBookDeleteForm bookId={book.id} disabled={deleteDisabled} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
