"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 관리자: 사용자에게 활성 구독(VIP) 행을 부여합니다. 기존 `active` 행은 `canceled`로 바꿉니다.
 *
 * @history
 * - 2026-03-28: 신규 — `user_subscriptions` 수동 부여(MVP)
 */
export async function adminAssignUserSubscription(formData: FormData): Promise<void> {
  await requireAdmin();

  const targetUserId = formData.get("targetUserId")?.toString().trim() ?? "";
  const planKey = formData.get("planKey")?.toString().trim() ?? "";
  const periodEndRaw = formData.get("currentPeriodEnd")?.toString().trim() ?? "";

  if (!UUID_RE.test(targetUserId) || !planKey || !periodEndRaw) {
    return;
  }

  const periodEnd = new Date(periodEndRaw);
  if (Number.isNaN(periodEnd.getTime())) {
    return;
  }

  const supabase = createSupabaseAdminClient();

  const { data: plan, error: pErr } = await supabase
    .from("subscription_plans")
    .select("plan_key")
    .eq("plan_key", planKey)
    .maybeSingle();

  if (pErr || !plan) {
    console.error("adminAssignUserSubscription: unknown plan", planKey, pErr);
    return;
  }

  const { error: cancelErr } = await supabase
    .from("user_subscriptions")
    .update({ status: "canceled" })
    .eq("user_id", targetUserId)
    .eq("status", "active");

  if (cancelErr) {
    console.error("adminAssignUserSubscription: cancel", cancelErr);
    return;
  }

  const { error: insErr } = await supabase.from("user_subscriptions").insert({
    user_id: targetUserId,
    plan_key: planKey,
    status: "active",
    current_period_end: periodEnd.toISOString()
  });

  if (insErr) {
    console.error("adminAssignUserSubscription: insert", insErr);
    return;
  }

  revalidatePath("/dashboard/admin/users");
}
