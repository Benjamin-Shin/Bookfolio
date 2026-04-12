import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizeCoverUrlForClient } from "@/lib/books/cover-url";

export type DiscoverCommunityBookRow = {
  bookId: string;
  isbn: string | null;
  title: string;
  authors: string[];
  coverUrl: string | null;
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  priceKrw: number | null;
  format: string;
  otherOwnerCount: number;
  lastAddedAt: string;
};

type RpcRow = {
  book_id: string;
  isbn: string | null;
  title: string;
  authors: string[] | null;
  cover_url: string | null;
  publisher: string | null;
  published_date: string | null;
  description: string | null;
  price_krw: number | null;
  format: string | null;
  other_owner_count: number | null;
  last_added_at: string;
};

/**
 * 발견 탭 — 타인이 먼저 등록한 캐논(본인 미소장·종이책).
 *
 * @history
 * - 2026-04-05: `list_discover_community_books` RPC 래핑·표지 URL 정규화
 */
export async function listDiscoverCommunityBooksForUser(
  userId: string,
  limit = 30
): Promise<DiscoverCommunityBookRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("list_discover_community_books", {
    p_user_id: userId,
    p_limit: limit
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as RpcRow[];
  return rows.map((r) => ({
    bookId: r.book_id,
    isbn: r.isbn,
    title: r.title,
    authors: Array.isArray(r.authors) ? r.authors : [],
    coverUrl: normalizeCoverUrlForClient(r.cover_url),
    publisher: r.publisher,
    publishedDate: r.published_date,
    description: r.description,
    priceKrw: r.price_krw,
    format: r.format ?? "paper",
    otherOwnerCount: r.other_owner_count ?? 0,
    lastAddedAt: r.last_added_at
  }));
}
