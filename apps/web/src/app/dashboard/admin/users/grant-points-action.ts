"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { tryAwardPointsForEvent } from "@/lib/points/award-points";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const EVENT_CODE_RE = /^[a-z][a-z0-9_]{0,62}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 관리자: 활성 정책의 `point_rules` 이벤트로 사용자에게 적립·차감(음수 규칙)을 1회 적용합니다.
 *
 * @history
 * - 2026-03-28: 신규 — 멱등 키 `admin_grant:…`
 */
export async function adminGrantPointsToUserFromRule(formData: FormData): Promise<void> {
  await requireAdmin();

  const targetUserId = formData.get("targetUserId")?.toString().trim() ?? "";
  const eventCode = formData.get("eventCode")?.toString().trim().toLowerCase() ?? "";
  if (!UUID_RE.test(targetUserId) || !EVENT_CODE_RE.test(eventCode)) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const idempotencyKey = `admin_grant:${targetUserId}:${crypto.randomUUID()}`;
  const result = await tryAwardPointsForEvent(supabase, {
    userId: targetUserId,
    eventCode,
    idempotencyKey,
    treatVipSpendExempt: false
  });

  if (!result.ok) {
    console.error("adminGrantPointsToUserFromRule", result);
    return;
  }

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/points");
}
