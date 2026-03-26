import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `books.isbn` 값 중 `keys`(정규화·10/13 변형 포함)에 해당하는 것만 모읍니다.
 *
 * @history
 * - 2026-03-26: 관리자 알라딘 일괄 추가·목록 제외에서 공통 사용
 */
export async function fetchExistingBooksIsbnSet(supabase: SupabaseClient, keys: string[]): Promise<Set<string>> {
  const unique = [...new Set(keys.filter(Boolean))];
  const found = new Set<string>();
  if (unique.length === 0) return found;
  const CHUNK = 150;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    const { data, error } = await supabase.from("books").select("isbn").in("isbn", chunk);
    if (error) throw error;
    for (const row of (data ?? []) as { isbn: string | null }[]) {
      if (row.isbn) found.add(row.isbn);
    }
  }
  return found;
}
