"use client";

import type { AdminSubscriptionPlanRow } from "@/lib/subscription/admin-subscription-plans";
import {
  SUBSCRIPTION_PLAN_FEATURE_KEYS,
  SUBSCRIPTION_PLAN_FEATURE_LABELS,
  extractFeaturesFromCapsJsonRoot
} from "@/lib/subscription/plan-caps";

import { updateSubscriptionPlanFeaturesFromForm } from "./subscription-plan-features-actions";

/**
 * 구독 플랜별 `caps_json.features` 체크박스(정책 CMS).
 *
 * @history
 * - 2026-04-05: 신규
 */
export function SubscriptionPlanFeaturesEditor({ plans }: { plans: AdminSubscriptionPlanRow[] }) {
  if (plans.length === 0) {
    return <p className="text-sm text-muted-foreground">등록된 구독 플랜이 없습니다.</p>;
  }

  return (
    <div className="space-y-6">
      {plans.map((p) => (
        <PlanFeaturesForm key={p.plan_key} plan={p} />
      ))}
    </div>
  );
}

function PlanFeaturesForm({ plan }: { plan: AdminSubscriptionPlanRow }) {
  const features = extractFeaturesFromCapsJsonRoot(plan.caps_json);

  return (
    <form action={updateSubscriptionPlanFeaturesFromForm} className="rounded-lg border border-border/80 bg-muted/20 p-4">
      <input type="hidden" name="planKey" value={plan.plan_key} />
      <h3 className="text-base font-semibold tracking-tight">
        <span className="font-mono text-sm">{plan.plan_key}</span>
        {plan.display_name ? (
          <span className="ml-2 font-sans font-normal text-muted-foreground">({plan.display_name})</span>
        ) : null}
      </h3>
      <ul className="mt-3 space-y-2">
        {SUBSCRIPTION_PLAN_FEATURE_KEYS.map((key) => (
          <li key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`${plan.plan_key}-${key}`}
              name={key}
              defaultChecked={features[key] === true}
              className="size-4 rounded border-border"
            />
            <label htmlFor={`${plan.plan_key}-${key}`} className="text-sm">
              {SUBSCRIPTION_PLAN_FEATURE_LABELS[key]}
              <code className="ml-2 rounded bg-muted px-1 py-0.5 font-mono text-xs text-muted-foreground">{key}</code>
            </label>
          </li>
        ))}
      </ul>
      <button
        type="submit"
        className="mt-4 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        저장
      </button>
    </form>
  );
}
