import { AdminPointRulesEditor } from "@/app/dashboard/admin/points/admin-point-rules-editor.client";
import { fetchAdminPointPolicyOverview, fetchAdminRecentLedger } from "@/lib/points/admin-points";

/**
 * 관리자 — 포인트 정책·원장.
 *
 * @history
 * - 2026-03-26: 이벤트 규칙 편집·추가 UI
 * - 2026-03-26: 신규 — `0021` 테이블 연동·내비 노출
 */
export default async function AdminPointsPage() {
  let versions: Awaited<ReturnType<typeof fetchAdminPointPolicyOverview>>["versions"] = [];
  let rules: Awaited<ReturnType<typeof fetchAdminPointPolicyOverview>>["rules"] = [];
  let ledger: Awaited<ReturnType<typeof fetchAdminRecentLedger>> = [];
  let loadError: string | null = null;

  try {
    const overview = await fetchAdminPointPolicyOverview();
    versions = overview.versions;
    rules = overview.rules;
    ledger = await fetchAdminRecentLedger(150);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.";
  }

  const versionLabel: Record<string, string> = Object.fromEntries(
    versions.map((v) => [v.id, `v${v.version}`])
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">포인트 · 정책</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          정책 버전·이벤트 규칙(점수·일·월 한도)을 편집하고 원장을 봅니다. 가입·서재 등록 지급은{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">0022</code> 시드 및 앱 로직과 연동됩니다.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">정책 버전</h2>
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 정책 버전이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/80">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/40">
                <tr>
                  <th className="px-3 py-2 font-medium">버전</th>
                  <th className="px-3 py-2 font-medium">시행 시각</th>
                  <th className="px-3 py-2 font-medium">비고</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">v{v.version}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {new Date(v.effective_from).toLocaleString("ko-KR")}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{v.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">이벤트 규칙</h2>
        {!loadError && versions.length > 0 ? (
          <AdminPointRulesEditor versions={versions} rules={rules} versionLabel={versionLabel} />
        ) : loadError ? null : (
          <p className="text-sm text-muted-foreground">정책 버전이 없어 규칙을 편집할 수 없습니다.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">최근 원장</h2>
        <p className="text-xs text-muted-foreground">최대 150건, 최신순.</p>
        {ledger.length === 0 ? (
          <p className="text-sm text-muted-foreground">원장 기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/80">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/40">
                <tr>
                  <th className="px-3 py-2 font-medium">일시</th>
                  <th className="px-3 py-2 font-medium">이메일</th>
                  <th className="px-3 py-2 font-medium">증감</th>
                  <th className="px-3 py-2 font-medium">잔액</th>
                  <th className="px-3 py-2 font-medium">사유</th>
                  <th className="px-3 py-2 font-medium">참조</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0">
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {new Date(row.created_at).toLocaleString("ko-KR")}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs">
                      {row.user_email ?? row.user_id.slice(0, 8) + "…"}
                    </td>
                    <td
                      className={
                        row.delta >= 0
                          ? "px-3 py-2 tabular-nums text-emerald-700 dark:text-emerald-400"
                          : "px-3 py-2 tabular-nums text-destructive"
                      }
                    >
                      {row.delta >= 0 ? `+${row.delta}` : row.delta}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{row.balance_after}</td>
                    <td className="max-w-[240px] truncate px-3 py-2" title={row.reason}>
                      {row.reason}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2 font-mono text-xs text-muted-foreground">
                      {row.ref_type ? `${row.ref_type}` : "—"}
                      {row.ref_id ? ` · ${row.ref_id.slice(0, 8)}…` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
