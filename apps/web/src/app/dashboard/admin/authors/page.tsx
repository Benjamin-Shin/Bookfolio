import Link from "next/link";
import type { Route } from "next";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

import { AdminAuthorCreateForm } from "./admin-author-create-form";
import { AuthorNameForm } from "./author-name-form";

type AuthorRow = {
  id: string;
  name: string;
  created_at: string;
};

type BookAuthorLink = {
  author_id: string;
};

/**
 * 관리자 전용 저자 마스터(`authors`) 목록. `book_authors` 로 도서와 연결됩니다.
 *
 * @history
 * - 2026-03-24: 초기 추가 (데이터 관리 전용)
 */
export default async function AdminAuthorsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";

  const supabase = createSupabaseAdminClient();

  let query = supabase.from("authors").select("id,name,created_at").order("name", { ascending: true }).limit(1000);

  const safeQ = q.replace(/[%_,]/g, "").trim();
  if (safeQ) {
    query = query.ilike("name", `%${safeQ}%`);
  }

  const { data: authorRows, error: authorsErr } = await query;

  if (authorsErr) {
    return (
      <p className="text-sm text-destructive">저자 목록을 불러오지 못했습니다: {authorsErr.message}</p>
    );
  }

  const authors = (authorRows ?? []) as AuthorRow[];

  const { data: linkRows, error: linksErr } = await supabase.from("book_authors").select("author_id");

  if (linksErr) {
    return (
      <p className="text-sm text-destructive">연결 정보를 불러오지 못했습니다: {linksErr.message}</p>
    );
  }

  const bookCountByAuthor = new Map<string, number>();
  for (const row of (linkRows ?? []) as BookAuthorLink[]) {
    const id = row.author_id;
    bookCountByAuthor.set(id, (bookCountByAuthor.get(id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">저자 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            공유 서지 저자 마스터입니다. 도서의 저자 문자열은{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">book_authors</code>를 통해 동기화됩니다.
          </p>
        </div>
        <Link
          href={"/dashboard/admin/books" as Route}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          도서 관리로
        </Link>
      </div>

      <AdminAuthorCreateForm />

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label htmlFor="author-q" className="text-sm font-medium">
            검색
          </label>
          <input
            id="author-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="이름 일부"
            className="flex h-9 w-full min-w-[12rem] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:w-64"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          검색
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border/80">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">이름</th>
              <th className="px-3 py-2 font-medium">연결 도서 수</th>
              <th className="px-3 py-2 font-medium">등록일</th>
            </tr>
          </thead>
          <tbody>
            {authors.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                  {safeQ ? "검색 결과가 없습니다." : "등록된 저자가 없습니다."}
                </td>
              </tr>
            ) : (
              authors.map((a) => {
                const n = bookCountByAuthor.get(a.id) ?? 0;
                return (
                  <tr key={a.id} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2 align-middle">
                      <AuthorNameForm authorId={a.id} initialName={a.name} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted-foreground">{n}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("ko-KR")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
