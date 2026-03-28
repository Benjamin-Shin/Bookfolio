import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `user_points_ledger` 최신 행 기준 잔액(없으면 0).
 *
 * @history
 * - 2026-03-28: 신규
 */
export async function getUserPointsBalance(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("user_points_ledger")
    .select("balance_after")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data?.balance_after != null ? Number(data.balance_after) : 0;
}
