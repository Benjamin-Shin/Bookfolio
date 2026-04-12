import { fetchAdminClientErrors } from "@/lib/client-errors/admin-client-errors";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * 관리자 — 클라이언트 오류 수집 목록.
 *
 * @history
 * - 2026-04-10: 신규
 */
export default async function AdminClientErrorsPage() {
  await requireAdmin();

  let rows: Awaited<ReturnType<typeof fetchAdminClientErrors>> = [];
  let loadError: string | null = null;
  try {
    rows = await fetchAdminClientErrors(200);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "목록을 불러오지 못했습니다.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">클라이언트 오류</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          앱·웹이 <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /api/client-errors</code>로 보낸
          항목입니다. 최대 200건, 최신순.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      {rows.length === 0 && !loadError ? (
        <p className="text-sm text-muted-foreground">수집된 오류가 없습니다.</p>
      ) : null}

      <div className="space-y-4">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-lg border border-border/80 bg-muted/15 p-4 text-sm shadow-sm"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <time className="whitespace-nowrap text-xs text-muted-foreground">
                {new Date(row.created_at).toLocaleString("ko-KR")}
              </time>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{row.platform}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{row.kind}</span>
              {row.user_id ? (
                <span className="font-mono text-xs text-muted-foreground" title={row.user_id}>
                  user {row.user_id.slice(0, 8)}…
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">익명</span>
              )}
            </div>
            <p className="mt-2 whitespace-pre-wrap font-medium text-foreground">{row.message}</p>
            {Object.keys(row.context).length > 0 ? (
              <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-background/80 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                {JSON.stringify(row.context, null, 2)}
              </pre>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
