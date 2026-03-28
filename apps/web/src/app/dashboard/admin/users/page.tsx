import { requireAdmin } from "@/lib/auth/require-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAdminPointPolicyOverview } from "@/lib/points/admin-points";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

import { CopyUserIdButton } from "./copy-user-id-button.client";
import { adminGrantPointsToUserFromRule } from "./grant-points-action";
import { adminAssignUserSubscription } from "./vip-subscription-action";
import { UserNameForm } from "./user-name-form";
import { UserRoleForm } from "./user-role-form";

type AppUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  app_profiles: { display_name: string | null } | { display_name: string | null }[] | null;
};

function effectiveUserDisplayName(row: AppUserRow): string | null {
  const prof = row.app_profiles;
  const fromProfile = Array.isArray(prof) ? prof[0]?.display_name : prof?.display_name;
  return (fromProfile ?? row.name) ?? null;
}

/**
 * 관리자 전용 사용자 목록 페이지.
 *
 * @history
 * - 2026-03-28: `<select>`에 `suppressHydrationWarning`(확장 프로그램 `data-sharkid` 등 DOM 변조와 SSR 불일치 방지)
 * - 2026-03-28: 사용자 ID `CopyUserIdButton` 클립보드 복사
 * - 2026-03-28: VIP 구독 수동 부여 폼(`adminAssignUserSubscription`)
 * - 2026-03-28: 규칙별 포인트 지급 폼·사용자 ID 열
 * - 2026-03-28: 포인트 잔액·VIP 활성 컬럼(`v_user_points_balance`, `user_subscriptions`)
 * - 2026-03-24: 이름 컬럼에 인라인 편집(`UserNameForm`) 및 프로필 표시명 조회
 */
export default async function AdminUsersPage() {
  await requireAdmin();

  let grantRuleOptions: { event_code: string; points: number }[] = [];
  try {
    const overview = await fetchAdminPointPolicyOverview();
    const maxVersionId = overview.versions[0]?.id;
    grantRuleOptions = overview.rules
      .filter((r) => r.rule_version_id === maxVersionId && r.points !== 0)
      .map((r) => ({ event_code: r.event_code, points: r.points }))
      .sort((a, b) => a.event_code.localeCompare(b.event_code));
  } catch {
    grantRuleOptions = [];
  }

  const supabase = createSupabaseAdminClient();
  const { data: rows, error } = await supabase
    .from("app_users")
    .select("id,email,name,role,created_at,app_profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <p className="text-sm text-destructive">
        사용자 목록을 불러오지 못했습니다: {error.message}
      </p>
    );
  }

  const users = (rows ?? []) as AppUserRow[];
  const userIds = users.map((u) => u.id);
  const nowIso = new Date().toISOString();

  type PlanRow = { plan_key: string; display_name: string | null };
  let subscriptionPlans: PlanRow[] = [];
  let subscriptionPlansError: Error | null = null;
  {
    const p = await supabase.from("subscription_plans").select("plan_key,display_name").order("plan_key");
    if (p.error) {
      subscriptionPlansError = new Error(p.error.message);
    } else {
      subscriptionPlans = (p.data ?? []) as PlanRow[];
    }
  }

  type BalanceRow = { user_id: string; points_balance: number };
  let balanceRows: BalanceRow[] = [];
  let balanceFetchError: Error | null = null;
  let vipRows: { user_id: string }[] = [];
  let vipFetchError: Error | null = null;

  if (userIds.length > 0) {
    const [b, v] = await Promise.all([
      supabase.from("v_user_points_balance").select("user_id, points_balance").in("user_id", userIds),
      supabase
        .from("user_subscriptions")
        .select("user_id")
        .in("user_id", userIds)
        .eq("status", "active")
        .gt("current_period_end", nowIso)
    ]);
    if (b.error) {
      balanceFetchError = new Error(b.error.message);
    } else {
      balanceRows = (b.data ?? []) as BalanceRow[];
    }
    if (v.error) {
      vipFetchError = new Error(v.error.message);
    } else {
      vipRows = (v.data ?? []) as { user_id: string }[];
    }
  }

  const balanceByUser = new Map<string, number>();
  for (const r of balanceRows) {
    balanceByUser.set(r.user_id, Number(r.points_balance));
  }

  const vipActive = new Set<string>();
  for (const r of vipRows) {
    vipActive.add(r.user_id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">사용자 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          최근 가입 순(최대 500명). 첫 관리자는 DB에서 직접{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">role = &apos;ADMIN&apos;</code>으로 지정하세요.
        </p>
      </div>

      {balanceFetchError ? (
        <p className="text-sm text-destructive">포인트 잔액 뷰 조회 실패: {balanceFetchError.message}</p>
      ) : null}
      {vipFetchError ? (
        <p className="text-sm text-destructive">구독 조회 실패: {vipFetchError.message}</p>
      ) : null}

      <section className="space-y-2 rounded-lg border border-border/80 bg-muted/10 p-4">
        <h2 className="text-sm font-semibold tracking-tight">규칙으로 포인트 적용</h2>
        <p className="text-xs text-muted-foreground">
          활성 정책 버전의 이벤트 코드로 1회 적립·차감합니다. 대상 사용자 ID는 아래 표의 UUID 열을 복사하세요.
        </p>
        {grantRuleOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">표시할 규칙이 없습니다. 포인트 정책 페이지를 확인하세요.</p>
        ) : (
          <form action={adminGrantPointsToUserFromRule} className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-[14rem] flex-col gap-0.5 text-xs">
              <span className="text-muted-foreground">사용자 UUID</span>
              <Input
                name="targetUserId"
                required
                placeholder="00000000-0000-…"
                className="h-8 font-mono text-xs"
              />
            </label>
            <label className="flex min-w-[12rem] flex-col gap-0.5 text-xs">
              <span className="text-muted-foreground">이벤트</span>
              <select
                name="eventCode"
                required
                suppressHydrationWarning
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {grantRuleOptions.map((r) => (
                  <option key={r.event_code} value={r.event_code}>
                    {r.event_code} ({r.points > 0 ? "+" : ""}
                    {r.points})
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm">
              적용
            </Button>
          </form>
        )}
      </section>

      {subscriptionPlansError ? (
        <p className="text-sm text-destructive">
          구독 플랜 목록 조회 실패: {subscriptionPlansError.message}
        </p>
      ) : null}

      <section className="space-y-2 rounded-lg border border-border/80 bg-muted/10 p-4">
        <h2 className="text-sm font-semibold tracking-tight">VIP 구독 부여</h2>
        <p className="text-xs text-muted-foreground">
          대상 사용자의 기존 활성 구독은 취소 처리한 뒤, 선택한 플랜으로 새 행을 추가합니다. 종료일은 브라우저 로컬 기준으로 입력하세요.
        </p>
        {subscriptionPlans.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            등록된 플랜이 없습니다. 마이그레이션·DB의 <code className="rounded bg-muted px-1">subscription_plans</code>를 확인하세요.
          </p>
        ) : (
          <form action={adminAssignUserSubscription} className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-[14rem] flex-col gap-0.5 text-xs">
              <span className="text-muted-foreground">사용자 UUID</span>
              <Input
                name="targetUserId"
                required
                placeholder="00000000-0000-…"
                className="h-8 font-mono text-xs"
              />
            </label>
            <label className="flex min-w-[12rem] flex-col gap-0.5 text-xs">
              <span className="text-muted-foreground">플랜</span>
              <select
                name="planKey"
                required
                suppressHydrationWarning
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {subscriptionPlans.map((pl) => (
                  <option key={pl.plan_key} value={pl.plan_key}>
                    {pl.display_name?.trim() ? pl.display_name : pl.plan_key} ({pl.plan_key})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[12rem] flex-col gap-0.5 text-xs">
              <span className="text-muted-foreground">종료 일시 (로컬)</span>
              <Input type="datetime-local" name="currentPeriodEnd" required className="h-8 text-xs" />
            </label>
            <Button type="submit" size="sm" variant="secondary">
              부여
            </Button>
          </form>
        )}
      </section>

      <div className="overflow-x-auto rounded-lg border border-border/80">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">사용자 ID</th>
              <th className="px-3 py-2 font-medium">이메일</th>
              <th className="px-3 py-2 font-medium">이름</th>
              <th className="px-3 py-2 font-medium">가입일</th>
              <th className="px-3 py-2 text-right font-medium">포인트</th>
              <th className="px-3 py-2 font-medium">VIP</th>
              <th className="px-3 py-2 font-medium">권한</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const role =
                u.role === "ADMIN" ? "ADMIN" : u.role === "STAFF" ? "STAFF" : "USER";
              const balance = balanceByUser.get(u.id) ?? 0;
              const vip = vipActive.has(u.id);
              return (
                <tr key={u.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex max-w-[12rem] items-center gap-0.5 sm:max-w-[14rem]">
                      <span
                        className="min-w-0 truncate font-mono text-[10px] leading-tight text-muted-foreground"
                        title={u.id}
                      >
                        {u.id}
                      </span>
                      <CopyUserIdButton userId={u.id} />
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                  <td className="px-3 py-2 align-middle">
                    <UserNameForm userId={u.id} initialName={effectiveUserDisplayName(u)} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {new Date(u.created_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                    {balanceFetchError ? "—" : balance.toLocaleString("ko-KR")}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{vipFetchError ? "—" : vip ? "예" : ""}</td>
                  <td className="px-3 py-2">
                    <UserRoleForm userId={u.id} currentRole={role} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
