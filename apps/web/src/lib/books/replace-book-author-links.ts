import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `book_authors` 행을 교체하고, 트리거로 `books.authors` text[] 를 동기화합니다.
 *
 * @history
 * - 2026-03-24: 최초 추가 (`replace_book_author_links` RPC 호출)
 */
export async function replaceBookAuthorLinks(
  supabase: SupabaseClient,
  bookId: string,
  authorNames: string[]
): Promise<void> {
  const { error } = await supabase.rpc("replace_book_author_links", {
    p_book_id: bookId,
    p_names: authorNames
  });
  if (error) {
    throw error;
  }
}
