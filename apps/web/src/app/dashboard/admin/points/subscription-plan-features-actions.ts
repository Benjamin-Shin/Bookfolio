"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  SUBSCRIPTION_PLAN_FEATURE_KEYS,
  mergeKnownFeaturesIntoCapsJson,
  type SubscriptionPlanFeatureKey
} from "@/lib/subscription/plan-caps";

/**
 * 관리자: `subscription_plans.caps_json.features`의 알려진 키만 갱신합니다(나머지 JSON은 유지).
 *
 * @history
 * - 2026-04-05: 신규
 */
export async function updateSubscriptionPlanFeaturesFromForm(formData: FormData): Promise<void> {
  await requireAdmin();

  const planKey = formData.get("planKey")?.toString().trim();
  if (!planKey) {
    return;
  }

  const updates: Partial<Record<SubscriptionPlanFeatureKey, boolean>> = {};
  for (const key of SUBSCRIPTION_PLAN_FEATURE_KEYS) {
    updates[key] = formData.get(key) === "on";
  }

  const supabase = createSupabaseAdminClient();
  const { data: row, error: rErr } = await supabase
    .from("subscription_plans")
    .select("caps_json")
    .eq("plan_key", planKey)
    .maybeSingle();

  if (rErr) {
    console.error("updateSubscriptionPlanFeaturesFromForm read", rErr);
    return;
  }

  const nextJson = mergeKnownFeaturesIntoCapsJson(row?.caps_json, updates);

  const { error: uErr } = await supabase.from("subscription_plans").update({ caps_json: nextJson }).eq("plan_key", planKey);

  if (uErr) {
    console.error("updateSubscriptionPlanFeaturesFromForm write", uErr);
    return;
  }

  revalidatePath("/dashboard/admin/points");
}
