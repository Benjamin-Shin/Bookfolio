import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `subscription_plans.caps_json` / 스냅샷 내부 `caps` 블록.
 *
 * @history
 * - 2026-03-28: 신규 — 공동서재 생성·멤버 상한
 */
export type SubscriptionCaps = {
  shared_libraries_owned_max?: number;
  shared_library_members_total_max?: number;
  shared_library_invites_per_library_per_month?: number;
  [key: string]: unknown;
};

function extractCapsFromPlanJson(capsJson: unknown): SubscriptionCaps {
  if (!capsJson || typeof capsJson !== "object" || Array.isArray(capsJson)) {
    return {};
  }
  const o = capsJson as Record<string, unknown>;
  const inner = o.caps;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as SubscriptionCaps;
  }
  return {};
}

/**
 * 활성 구독이 있으면 플랜의 `caps`를 돌려줍니다. `caps_snapshot_json`이 있으면 우선.
 *
 * @history
 * - 2026-03-28: 신규
 */
export async function getActiveSubscriptionCaps(
  supabase: SupabaseClient,
  userId: string
): Promise<{ planKey: string; caps: SubscriptionCaps } | null> {
  const now = new Date().toISOString();
  const { data: sub, error: sErr } = await supabase
    .from("user_subscriptions")
    .select("plan_key, caps_snapshot_json")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("current_period_end", now)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sErr) {
    throw sErr;
  }
  if (!sub) {
    return null;
  }

  const snap = sub.caps_snapshot_json;
  if (snap !== null && snap !== undefined && typeof snap === "object" && !Array.isArray(snap)) {
    const c = (snap as { caps?: unknown }).caps;
    if (c && typeof c === "object" && !Array.isArray(c)) {
      return { planKey: sub.plan_key as string, caps: c as SubscriptionCaps };
    }
  }

  const { data: plan, error: pErr } = await supabase
    .from("subscription_plans")
    .select("caps_json")
    .eq("plan_key", sub.plan_key as string)
    .maybeSingle();

  if (pErr) {
    throw pErr;
  }

  return {
    planKey: sub.plan_key as string,
    caps: extractCapsFromPlanJson(plan?.caps_json)
  };
}
