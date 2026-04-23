import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `subscription_plans.caps_json` / 스냅샷 내부 `caps` 블록.
 *
 * @history
 * - 2026-04-05: `resolveActiveSubscription` — 스냅샷에 `features` 병합
 * - 2026-03-28: 신규 — 공동서가 생성·멤버 상한
 */
export type SubscriptionCaps = {
  shared_libraries_owned_max?: number;
  shared_library_members_total_max?: number;
  shared_library_invites_per_library_per_month?: number;
  [key: string]: unknown;
};

/**
 * `caps_json.features` — 플랜·스냅샷별 기능 해금(관리자 포인트·정책 화면에서 편집).
 *
 * @history
 * - 2026-04-05: `reading_reports_unlocked`, `sns_share_unlocked` 추가
 */
export type SubscriptionPlanFeatures = {
  premium_themes_unlocked?: boolean;
  can_create_extra_shared_libraries_without_points?: boolean;
  reading_reports_unlocked?: boolean;
  sns_share_unlocked?: boolean;
  [key: string]: unknown;
};

/** 관리자 UI·폼에서 다루는 기능 키(알 수 없는 키는 JSON에 남고 편집만 생략). */
export const SUBSCRIPTION_PLAN_FEATURE_KEYS = [
  "premium_themes_unlocked",
  "can_create_extra_shared_libraries_without_points",
  "reading_reports_unlocked",
  "sns_share_unlocked",
] as const;

export type SubscriptionPlanFeatureKey =
  (typeof SUBSCRIPTION_PLAN_FEATURE_KEYS)[number];

export const SUBSCRIPTION_PLAN_FEATURE_LABELS: Record<
  SubscriptionPlanFeatureKey,
  string
> = {
  premium_themes_unlocked: "프리미엄 테마",
  can_create_extra_shared_libraries_without_points: "추가 공동서가 포인트 면제",
  reading_reports_unlocked: "독서 리포트",
  sns_share_unlocked: "SNS 공유",
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

/** `subscription_plans.caps_json` 루트에서 `features` 객체만 추출합니다. */
export function extractFeaturesFromCapsJsonRoot(
  capsJson: unknown,
): SubscriptionPlanFeatures {
  if (!capsJson || typeof capsJson !== "object" || Array.isArray(capsJson)) {
    return {};
  }
  const o = capsJson as Record<string, unknown>;
  const inner = o.features;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as SubscriptionPlanFeatures;
  }
  return {};
}

/**
 * `caps_json` 루트에 `features`만 알려진 키로 덮어씁니다(`points_spend_exempt`, `caps`, 기타 키 유지).
 *
 * @history
 * - 2026-04-05: 신규
 */
export function mergeKnownFeaturesIntoCapsJson(
  current: unknown,
  updates: Partial<Record<SubscriptionPlanFeatureKey, boolean>>,
): Record<string, unknown> {
  const base =
    current !== null &&
    current !== undefined &&
    typeof current === "object" &&
    !Array.isArray(current)
      ? ({ ...current } as Record<string, unknown>)
      : {};

  const prevFeaturesRaw = base.features;
  const prevFeatures =
    prevFeaturesRaw !== null &&
    prevFeaturesRaw !== undefined &&
    typeof prevFeaturesRaw === "object" &&
    !Array.isArray(prevFeaturesRaw)
      ? ({ ...prevFeaturesRaw } as Record<string, unknown>)
      : {};

  for (const key of SUBSCRIPTION_PLAN_FEATURE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      prevFeatures[key] = updates[key] === true;
    }
  }

  base.features = prevFeatures;
  return base;
}

async function resolveActiveSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  planKey: string;
  caps: SubscriptionCaps;
  features: SubscriptionPlanFeatures;
} | null> {
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

  const { data: plan, error: pErr } = await supabase
    .from("subscription_plans")
    .select("caps_json")
    .eq("plan_key", sub.plan_key as string)
    .maybeSingle();

  if (pErr) {
    throw pErr;
  }

  let caps = extractCapsFromPlanJson(plan?.caps_json);
  let features = extractFeaturesFromCapsJsonRoot(plan?.caps_json);

  const snap = sub.caps_snapshot_json;
  if (
    snap !== null &&
    snap !== undefined &&
    typeof snap === "object" &&
    !Array.isArray(snap)
  ) {
    const s = snap as Record<string, unknown>;
    if (
      s.caps !== null &&
      s.caps !== undefined &&
      typeof s.caps === "object" &&
      !Array.isArray(s.caps)
    ) {
      caps = s.caps as SubscriptionCaps;
    }
    if (
      Object.prototype.hasOwnProperty.call(s, "features") &&
      s.features !== null &&
      s.features !== undefined &&
      typeof s.features === "object" &&
      !Array.isArray(s.features)
    ) {
      features = s.features as SubscriptionPlanFeatures;
    }
  }

  return { planKey: sub.plan_key as string, caps, features };
}

/**
 * 활성 구독이 있으면 플랜의 `caps`를 돌려줍니다. `caps_snapshot_json`이 있으면 우선.
 *
 * @history
 * - 2026-04-05: 스냅샷·플랜 병합을 `resolveActiveSubscription`에 위임
 * - 2026-03-28: 신규
 */
export async function getActiveSubscriptionCaps(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ planKey: string; caps: SubscriptionCaps } | null> {
  const r = await resolveActiveSubscription(supabase, userId);
  if (!r) {
    return null;
  }
  return { planKey: r.planKey, caps: r.caps };
}

/**
 * 활성 구독의 `caps_json.features`(또는 스냅샷 `features`)를 돌려줍니다.
 *
 * @history
 * - 2026-04-05: 신규
 */
export async function getActiveSubscriptionFeatures(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ planKey: string; features: SubscriptionPlanFeatures } | null> {
  const r = await resolveActiveSubscription(supabase, userId);
  if (!r) {
    return null;
  }
  return { planKey: r.planKey, features: r.features };
}
