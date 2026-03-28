import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 활성 VIP 구독 여부 — `user_subscriptions.status = active` 이고 `current_period_end` > now().
 *
 * @history
 * - 2026-03-28: 신규 — 포인트 차감 면제·플랜 cap 게이트용
 */
export async function hasActiveVipSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("current_period_end", now)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return !!data?.id;
}
