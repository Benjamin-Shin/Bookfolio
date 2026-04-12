import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminSubscriptionPlanRow = {
  plan_key: string;
  display_name: string | null;
  caps_json: unknown;
};

/**
 * 관리자 — 구독 플랜 `caps_json`(기능 플래그 편집용) 목록.
 *
 * @history
 * - 2026-04-05: 신규 — 정책 CMS(포인트·정책 화면) 연동
 */
export async function fetchAdminSubscriptionPlansForFeatures(): Promise<AdminSubscriptionPlanRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("plan_key,display_name,caps_json")
    .order("plan_key");

  if (error) {
    throw error;
  }
  return (data ?? []) as AdminSubscriptionPlanRow[];
}
