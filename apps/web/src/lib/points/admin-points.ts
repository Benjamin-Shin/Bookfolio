import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminPointRuleVersionRow = {
  id: string;
  version: number;
  effective_from: string;
  notes: string | null;
  created_at: string;
};

export type AdminPointRuleRow = {
  id: string;
  rule_version_id: string;
  event_code: string;
  points: number;
  daily_cap_per_user: number | null;
  monthly_cap_per_user: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminLedgerRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  delta: number;
  balance_after: number;
  reason: string;
  ref_type: string | null;
  ref_id: string | null;
  idempotency_key: string;
  created_at: string;
};

/**
 * 관리자 화면용: 정책 버전 목록과 해당 버전에 묶인 규칙 행.
 *
 * @history
 * - 2026-03-26: 관리자 포인트 개요 페이지용 조회 추가
 */
export async function fetchAdminPointPolicyOverview(): Promise<{
  versions: AdminPointRuleVersionRow[];
  rules: AdminPointRuleRow[];
}> {
  const supabase = createSupabaseAdminClient();

  const { data: versions, error: vErr } = await supabase
    .from("point_rule_versions")
    .select("id,version,effective_from,notes,created_at")
    .order("version", { ascending: false });

  if (vErr) {
    throw vErr;
  }

  const versionList = (versions ?? []) as AdminPointRuleVersionRow[];
  if (versionList.length === 0) {
    return { versions: [], rules: [] };
  }

  const versionIds = versionList.map((v) => v.id);
  const { data: rules, error: rErr } = await supabase
    .from("point_rules")
    .select(
      "id,rule_version_id,event_code,points,daily_cap_per_user,monthly_cap_per_user,metadata,created_at"
    )
    .in("rule_version_id", versionIds)
    .order("event_code", { ascending: true });

  if (rErr) {
    throw rErr;
  }

  const rawRules = (rules ?? []) as unknown as AdminPointRuleRow[];
  const normalized: AdminPointRuleRow[] = rawRules.map((r) => {
    const meta = r.metadata;
    return {
      ...r,
      metadata:
        meta && typeof meta === "object" && !Array.isArray(meta)
          ? (meta as Record<string, unknown>)
          : {}
    };
  });

  return { versions: versionList, rules: normalized };
}

/**
 * 관리자 화면용: 최근 원장(이메일은 `app_users`에서 부침).
 *
 * @history
 * - 2026-03-26: 신규
 */
export async function fetchAdminRecentLedger(limit = 150): Promise<AdminLedgerRow[]> {
  const supabase = createSupabaseAdminClient();
  const safeLimit = Math.min(Math.max(limit, 1), 500);

  const { data: ledger, error } = await supabase
    .from("user_points_ledger")
    .select("id,user_id,delta,balance_after,reason,ref_type,ref_id,idempotency_key,created_at")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw error;
  }

  const rows = ledger ?? [];
  if (rows.length === 0) {
    return [];
  }

  const userIds = [...new Set(rows.map((r) => r.user_id as string))];
  const { data: users, error: uErr } = await supabase.from("app_users").select("id,email").in("id", userIds);

  if (uErr) {
    throw uErr;
  }

  const emailById = new Map<string, string | null>();
  for (const u of users ?? []) {
    emailById.set(u.id as string, (u.email as string) ?? null);
  }

  return rows.map((r) => ({
    id: r.id as string,
    user_id: r.user_id as string,
    user_email: emailById.get(r.user_id as string) ?? null,
    delta: Number(r.delta),
    balance_after: Number(r.balance_after),
    reason: r.reason as string,
    ref_type: (r.ref_type as string | null) ?? null,
    ref_id: (r.ref_id as string | null) ?? null,
    idempotency_key: r.idempotency_key as string,
    created_at: r.created_at as string
  }));
}
