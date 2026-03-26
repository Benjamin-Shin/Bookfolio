import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { POINT_EVENT_CODES, type PointEventCode } from "@/lib/points/event-codes";

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * 활성 정책 버전(`point_rule_versions.version` 최댓값)에 대해 이벤트 규칙을 조회·한도 검사 후 원장에 1행 적립합니다.
 * `idempotency_key`가 이미 있으면 아무 것도 하지 않습니다.
 *
 * @history
 * - 2026-03-26: 신규 — 가입·도서 등록 연동
 */
export async function tryAwardPointsForEvent(
  supabase: SupabaseClient,
  params: {
    userId: string;
    eventCode: PointEventCode;
    idempotencyKey: string;
    refType?: string | null;
    refId?: string | null;
  }
): Promise<{ awarded: boolean; delta?: number; balanceAfter?: number }> {
  const { data: dup } = await supabase
    .from("user_points_ledger")
    .select("id")
    .eq("idempotency_key", params.idempotencyKey)
    .maybeSingle();

  if (dup?.id) {
    return { awarded: false };
  }

  const { data: ver, error: vErr } = await supabase
    .from("point_rule_versions")
    .select("id")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (vErr) {
    throw vErr;
  }
  if (!ver?.id) {
    return { awarded: false };
  }

  const { data: rule, error: rErr } = await supabase
    .from("point_rules")
    .select("points,rule_version_id,daily_cap_per_user,monthly_cap_per_user")
    .eq("rule_version_id", ver.id)
    .eq("event_code", params.eventCode)
    .maybeSingle();

  if (rErr) {
    throw rErr;
  }

  const points = rule?.points != null ? Number(rule.points) : 0;
  if (!rule || points <= 0) {
    return { awarded: false };
  }

  const ruleVersionId = rule.rule_version_id as string;

  const now = new Date();
  if (rule.daily_cap_per_user != null && rule.daily_cap_per_user >= 0) {
    const from = startOfUtcDay(now).toISOString();
    const { count, error: cErr } = await supabase
      .from("user_points_ledger")
      .select("*", { count: "exact", head: true })
      .eq("user_id", params.userId)
      .eq("reason", params.eventCode)
      .gte("created_at", from);
    if (cErr) {
      throw cErr;
    }
    if ((count ?? 0) >= rule.daily_cap_per_user) {
      return { awarded: false };
    }
  }

  if (rule.monthly_cap_per_user != null && rule.monthly_cap_per_user >= 0) {
    const from = startOfUtcMonth(now).toISOString();
    const { count, error: cErr } = await supabase
      .from("user_points_ledger")
      .select("*", { count: "exact", head: true })
      .eq("user_id", params.userId)
      .eq("reason", params.eventCode)
      .gte("created_at", from);
    if (cErr) {
      throw cErr;
    }
    if ((count ?? 0) >= rule.monthly_cap_per_user) {
      return { awarded: false };
    }
  }

  const { data: last, error: lErr } = await supabase
    .from("user_points_ledger")
    .select("balance_after")
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lErr) {
    throw lErr;
  }

  const prev = last?.balance_after != null ? Number(last.balance_after) : 0;
  const delta = points;
  const balanceAfter = prev + delta;

  const { error: insErr } = await supabase.from("user_points_ledger").insert({
    user_id: params.userId,
    delta,
    balance_after: balanceAfter,
    reason: params.eventCode,
    ref_type: params.refType ?? null,
    ref_id: params.refId ?? null,
    rule_version_id: ruleVersionId,
    idempotency_key: params.idempotencyKey
  });

  if (insErr) {
    if (insErr.code === "23505") {
      return { awarded: false };
    }
    throw insErr;
  }

  return { awarded: true, delta, balanceAfter };
}

/**
 * 서버 전용 헬퍼: 가입(멤버십) 포인트 — `point_rules.event_code = join_membership`.
 *
 * @history
 * - 2026-03-26 — `join_membership` 이벤트로 통일
 */
export async function awardPointsJoinMembership(userId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await tryAwardPointsForEvent(supabase, {
    userId,
    eventCode: POINT_EVENT_CODES.join_membership,
    idempotencyKey: `join_membership:${userId}`,
    refType: "app_user",
    refId: userId
  });
}

/**
 * 서재 도서 등록 1권당 1회(멱등 키 = user_book id).
 *
 * @history
 * - 2026-03-26: 신규
 */
export async function awardPointsUserBookRegister(userId: string, userBookId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await tryAwardPointsForEvent(supabase, {
    userId,
    eventCode: POINT_EVENT_CODES.user_book_register,
    idempotencyKey: `user_book_register:${userBookId}`,
    refType: "user_book",
    refId: userBookId
  });
}
