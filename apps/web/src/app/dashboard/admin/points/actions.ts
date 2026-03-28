"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const EVENT_CODE_RE = /^[a-z][a-z0-9_]{0,62}$/;

function parseOptionalNonNegInt(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    return NaN;
  }
  return n;
}

function parseRequiredNonNegInt(raw: string | undefined): number {
  const n = Number(raw ?? "");
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    return NaN;
  }
  return n;
}

/** 포인트 규칙 점수: 양수(적립)·음수(차감), 0 불가 */
function parseRequiredPointsInt(raw: string | undefined): number {
  const n = Number(raw ?? "");
  if (!Number.isFinite(n) || n === 0 || !Number.isInteger(n)) {
    return NaN;
  }
  return n;
}

/**
 * 관리자: 기존 `point_rules` 행의 점수·한도만 갱신합니다.
 *
 * @history
 * - 2026-03-28: 점수 음수(차감) 허용
 * - 2026-03-26: 신규
 */
export async function updatePointRuleFromForm(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("ruleId")?.toString().trim();
  if (!id) {
    return;
  }

  const points = parseRequiredPointsInt(formData.get("points")?.toString());
  if (Number.isNaN(points)) {
    return;
  }

  const daily = parseOptionalNonNegInt(formData.get("dailyCap")?.toString());
  if (daily !== null && Number.isNaN(daily)) {
    return;
  }
  const monthly = parseOptionalNonNegInt(formData.get("monthlyCap")?.toString());
  if (monthly !== null && Number.isNaN(monthly)) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("point_rules")
    .update({
      points,
      daily_cap_per_user: daily,
      monthly_cap_per_user: monthly
    })
    .eq("id", id);

  if (error) {
    console.error("updatePointRuleFromForm", error);
    return;
  }

  revalidatePath("/dashboard/admin/points");
}

/**
 * 관리자: 특정 정책 버전에 새 이벤트 코드 행을 추가합니다.
 *
 * @history
 * - 2026-03-28: 점수 음수(차감) 허용
 * - 2026-03-26: 신규
 */
export async function createPointRuleFromForm(formData: FormData): Promise<void> {
  await requireAdmin();

  const versionId = formData.get("ruleVersionId")?.toString().trim();
  if (!versionId) {
    return;
  }

  const eventCode = formData.get("eventCode")?.toString().trim().toLowerCase() ?? "";
  if (!EVENT_CODE_RE.test(eventCode)) {
    return;
  }

  const points = parseRequiredPointsInt(formData.get("points")?.toString());
  if (Number.isNaN(points)) {
    return;
  }

  const daily = parseOptionalNonNegInt(formData.get("dailyCap")?.toString());
  if (daily !== null && Number.isNaN(daily)) {
    return;
  }
  const monthly = parseOptionalNonNegInt(formData.get("monthlyCap")?.toString());
  if (monthly !== null && Number.isNaN(monthly)) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("point_rules").insert({
    rule_version_id: versionId,
    event_code: eventCode,
    points,
    daily_cap_per_user: daily,
    monthly_cap_per_user: monthly,
    metadata: {}
  });

  if (error) {
    console.error("createPointRuleFromForm", error.code, error.message);
    return;
  }

  revalidatePath("/dashboard/admin/points");
}
