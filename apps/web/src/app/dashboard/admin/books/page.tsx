import Link from "next/link";

import { AdminBookDeleteForm } from "./admin-book-delete-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const PAGE_SIZE = 30;

type BookRow = {
  id: string;
  isbn: string | null;
  title: string;
  authors: string[];
  source: string;
  price_krw: number | null;
  genre_slugs: string[] | null;
  literature_region: string | null;
  original_language: string | null;
  updated_at: string;
};

type UserBookRef = {
  book_id: string;
  is_owned: boolean;
};

async function userBookRefStatsByBookIds(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  bookIds: string[]
): Promise<Map<string, { total: number; owned: number }>> {
  const map = new Map<string, { total: number; owned: number }>();
  if (bookIds.length === 0) return map;
  const { data } = await supabase.from("user_books").select("book_id, is_owned").in("book_id", bookIds);
  for (const row of (data ?? []) as UserBookRef[]) {
    const cur = map.get(row.book_id) ?? { total: 0, owned: 0 };
    cur.total += 1;
    if (row.is_owned) cur.owned += 1;
    map.set(row.book_id, cur);
  }
  return map;
}

export default async function AdminBooksPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("books")
    .select("id,isbn,title,authors,source,price_krw,genre_slugs,literature_region,original_language,updated_at", {
      count: "exact"
    })
    .order("updated_at", { ascending: false })
    .range(from, to);

  const safeQ = q.replace(/[%_,]/g, "").trim();
  if (safeQ) {
    query = query.or(`title.ilike.%${safeQ}%,isbn.ilike.%${safeQ}%`);
  }

  const { data: rows, error, count } = await query;

  if (error) {
    return (
      <p className="text-sm text-destructive">도서 목록을 불러오지 못했습니다: {error.message}</p>
    );
  }

  const books = (rows ?? []) as BookRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const refMap = await userBookRefStatsByBookIds(
    supabase,
    books.map((b) => b.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">도서 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            공유 서지(`books`)입니다. 제목·ISBN 일부 검색이 가능합니다. 소장 서재에 포함된 도서는 삭제할 수 없습니다.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/admin/books/new">도서 추가</Link>
        </Button>
      </div>

      <form className="flex flex-wrap items-end gap-2" method="get" action="/dashboard/admin/books">
        <div className="min-w-[12rem] flex-1 space-y-1">
          <label htmlFor="q" className="text-xs text-muted-foreground">
            검색
          </label>
          <Input id="q" name="q" type="search" placeholder="제목 또는 ISBN" defaultValue={q} />
        </div>
        <Button type="submit" size="sm">
          검색
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        총 {total.toLocaleString("ko-KR")}권 · {page} / {totalPages} 페이지
      </p>

      <div className="overflow-x-auto rounded-lg border border-border/80">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">제목</th>
              <th className="px-3 py-2 font-medium">ISBN</th>
              <th className="px-3 py-2 font-medium">저자</th>
              <th className="px-3 py-2 font-medium">가격</th>
              <th className="px-3 py-2 font-medium">장르</th>
              <th className="px-3 py-2 font-medium">출처</th>
              <th className="px-3 py-2 font-medium">수정일</th>
              <th className="px-3 py-2 font-medium">서재</th>
              <th className="px-3 py-2 text-right font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id} className="border-b border-border/40 last:border-0">
                <td className="max-w-[14rem] px-3 py-2 font-medium">
                  <span className="line-clamp-2">{b.title}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{b.isbn ?? "—"}</td>
                <td className="max-w-[10rem] truncate px-3 py-2 text-muted-foreground">
                  {(b.authors ?? []).join(", ") || "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                  {b.price_krw != null ? `${b.price_krw.toLocaleString("ko-KR")}원` : "—"}
                </td>
                <td className="max-w-[8rem] truncate px-3 py-2 text-xs text-muted-foreground">
                  {(b.genre_slugs ?? []).length > 0 ? b.genre_slugs!.join(", ") : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">{b.source}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                  {new Date(b.updated_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                  {(() => {
                    const s = refMap.get(b.id);
                    if (!s || s.total === 0) return "—";
                    return (
                      <span title={`소장 ${s.owned}건 · 전체 ${s.total}건`}>
                        {s.owned > 0 ? `소장 ${s.owned}` : "읽는 중만"} · {s.total}건
                      </span>
                    );
                  })()}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/admin/books/${b.id}/edit`}>수정</Link>
                    </Button>
                    <AdminBookDeleteForm
                      bookId={b.id}
                      disabled={(() => {
                        const s = refMap.get(b.id);
                        return (s?.total ?? 0) > 0;
                      })()}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap gap-2">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/admin/books?q=${encodeURIComponent(q)}&page=${page - 1}`}>이전</Link>
            </Button>
          ) : null}
          {page < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/admin/books?q=${encodeURIComponent(q)}&page=${page + 1}`}>다음</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
