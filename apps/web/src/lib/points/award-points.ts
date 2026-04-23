import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { hasActiveVipSubscription } from "@/lib/subscription/vip";

import { POINT_EVENT_CODES } from "@/lib/points/event-codes";

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

export type TryAwardPointsResult =
  | { ok: true; kind: "posted"; delta: number; balanceAfter: number }
  | { ok: true; kind: "vip_spend_exempt"; balanceAfter: number }
  | { ok: false; kind: "duplicate" }
  | { ok: false; kind: "no_rule_or_zero" }
  | { ok: false; kind: "insufficient_balance"; balanceAfter: number }
  | { ok: false; kind: "cap_reached" };

/**
 * 활성 정책 버전에 대해 이벤트 규칙을 조회·한도 검사 후 원장에 1행 반영합니다.
 * 양수=적립, 음수=차감. `points=0`이면 처리하지 않습니다.
 * 적립(`points>0`)일 때만 일·월 한도(UTC)를 적용합니다.
 * 차감(`points<0`)은 잔액이 부족하면 거부합니다.
 * VIP이면 차감을 원장에 올리지 않고 `vip_spend_exempt`로 성공 처리합니다(기본).
 *
 * @history
 * - 2026-03-28: 음수 차감·잔액 검사·VIP 소비 면제·적립 한도만 유지
 * - 2026-03-26: 신규 — 가입·도서 등록 연동
 */
export async function tryAwardPointsForEvent(
  supabase: SupabaseClient,
  params: {
    userId: string;
    eventCode: string;
    idempotencyKey: string;
    refType?: string | null;
    refId?: string | null;
    /** false면 VIP여도 차감 원장을 시도(관리자·백필용). 기본 true */
    treatVipSpendExempt?: boolean;
  },
): Promise<TryAwardPointsResult> {
  const treatVip = params.treatVipSpendExempt !== false;

  const { data: dup } = await supabase
    .from("user_points_ledger")
    .select("id")
    .eq("idempotency_key", params.idempotencyKey)
    .maybeSingle();

  if (dup?.id) {
    return { ok: false, kind: "duplicate" };
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
    return { ok: false, kind: "no_rule_or_zero" };
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
  if (!rule || points === 0 || Number.isNaN(points)) {
    return { ok: false, kind: "no_rule_or_zero" };
  }

  const ruleVersionId = rule.rule_version_id as string;
  const now = new Date();

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

  if (
    points < 0 &&
    treatVip &&
    (await hasActiveVipSubscription(supabase, params.userId))
  ) {
    return { ok: true, kind: "vip_spend_exempt", balanceAfter: prev };
  }

  if (points > 0) {
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
        return { ok: false, kind: "cap_reached" };
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
        return { ok: false, kind: "cap_reached" };
      }
    }
  }

  const delta = points;
  const balanceAfter = prev + delta;

  if (balanceAfter < 0) {
    return { ok: false, kind: "insufficient_balance", balanceAfter: prev };
  }

  const { error: insErr } = await supabase.from("user_points_ledger").insert({
    user_id: params.userId,
    delta,
    balance_after: balanceAfter,
    reason: params.eventCode,
    ref_type: params.refType ?? null,
    ref_id: params.refId ?? null,
    rule_version_id: ruleVersionId,
    idempotency_key: params.idempotencyKey,
  });

  if (insErr) {
    if (insErr.code === "23505") {
      return { ok: false, kind: "duplicate" };
    }
    throw insErr;
  }

  return { ok: true, kind: "posted", delta, balanceAfter };
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
    refId: userId,
  });
}

/**
 * 서가 도서 등록 1권당 1회(멱등 키 = user_book id).
 *
 * @history
 * - 2026-03-26: 신규
 */
export async function awardPointsUserBookRegister(
  userId: string,
  userBookId: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await tryAwardPointsForEvent(supabase, {
    userId,
    eventCode: POINT_EVENT_CODES.user_book_register,
    idempotencyKey: `user_book_register:${userBookId}`,
    refType: "user_book",
    refId: userBookId,
  });
}
