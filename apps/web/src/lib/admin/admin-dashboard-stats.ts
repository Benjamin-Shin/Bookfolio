import { createSupabaseAdminClient } from "@/lib/supabase/server";

/** 관리자 홈 상단에 표시하는 플랫폼 집계. */
export type AdminDashboardStats = {
  userCount: number;
  sharedLibraryCount: number;
  canonicalBookCount: number;
  userBookRowCount: number;
  authorCount: number;
  activeVipSubscriptionCount: number;
};

function countOrThrow(label: string, count: number | null, error: { message: string } | null): number {
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
  return count ?? 0;
}

/**
 * 관리자 대시보드 홈용 — 핵심 테이블 건수·유효 VIP 구독 수를 한 번에 조회합니다.
 *
 * @history
 * - 2026-03-29: 신규 — app_users·libraries·books·user_books·authors·활성 user_subscriptions 카운트
 */
export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = createSupabaseAdminClient();
  const periodEndAfter = new Date().toISOString();

  const [
    usersRes,
    librariesRes,
    booksRes,
    userBooksRes,
    authorsRes,
    vipRes
  ] = await Promise.all([
    supabase.from("app_users").select("*", { count: "exact", head: true }),
    supabase.from("libraries").select("*", { count: "exact", head: true }),
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase.from("user_books").select("*", { count: "exact", head: true }),
    supabase.from("authors").select("*", { count: "exact", head: true }),
    supabase
      .from("user_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .gt("current_period_end", periodEndAfter)
  ]);

  return {
    userCount: countOrThrow("app_users", usersRes.count, usersRes.error),
    sharedLibraryCount: countOrThrow("libraries", librariesRes.count, librariesRes.error),
    canonicalBookCount: countOrThrow("books", booksRes.count, booksRes.error),
    userBookRowCount: countOrThrow("user_books", userBooksRes.count, userBooksRes.error),
    authorCount: countOrThrow("authors", authorsRes.count, authorsRes.error),
    activeVipSubscriptionCount: countOrThrow("user_subscriptions", vipRes.count, vipRes.error)
  };
}
