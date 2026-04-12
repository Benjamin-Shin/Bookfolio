import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 캐논 `books.id`에 달린 공개 한줄평(회원 표시명 포함).
 *
 * @history
 * - 2026-04-08: 비소장 상세용 `GET .../community-one-liners`
 */
export type CanonCommunityOneLinerRow = {
  userId: string;
  displayName: string | null;
  body: string;
  updatedAt: string;
};

export async function listCanonCommunityOneLiners(
  admin: SupabaseClient,
  bookId: string,
  limit = 50
): Promise<CanonCommunityOneLinerRow[]> {
  const { data: liners, error } = await admin
    .from("book_one_liners")
    .select("user_id,body,updated_at")
    .eq("book_id", bookId)
    .order("updated_at", { ascending: false })
    .limit(Math.min(100, Math.max(1, limit)));

  if (error || !liners?.length) {
    return [];
  }

  const userIds = [...new Set(liners.map((r) => r.user_id as string))];
  const { data: profiles } = await admin.from("app_profiles").select("id,display_name").in("id", userIds);

  const nameBy = new Map<string, string | null>();
  for (const p of profiles ?? []) {
    nameBy.set(p.id as string, (p.display_name as string | null) ?? null);
  }

  return liners.map((row) => ({
    userId: row.user_id as string,
    displayName: nameBy.get(row.user_id as string) ?? null,
    body: row.body as string,
    updatedAt: row.updated_at as string
  }));
}
