import { requireAdmin } from "@/lib/auth/require-admin";
import { fetchAdminSharedLibrariesOverview } from "@/lib/libraries/admin-shared-libraries-overview";

/**
 * 관리자 전용 모임서가(`libraries`) 목록 — 멤버·연결 도서(캐논 기준 distinct) 수.
 *
 * @history
 * - 2026-03-29: 신규
 */
export default async function AdminSharedLibrariesPage() {
  await requireAdmin();

  let rows: Awaited<ReturnType<typeof fetchAdminSharedLibrariesOverview>> = [];
  let loadError: string | null = null;
  try {
    rows = await fetchAdminSharedLibrariesOverview();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "목록을 불러오지 못했습니다.";
  }

  const kindLabel = (k: string) => {
    if (k === "family") {
      return "가족";
    }
    if (k === "club") {
      return "모임";
    }
    return k;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">모임서가 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          등록된 모임서가와 참여 회원, 연결된 도서 권수(같은 책은 한 권으로
          집계)를 봅니다.
        </p>
      </div>

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          등록된 모임서가가 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/80">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">서가 이름</th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">
                  유형
                </th>
                <th className="px-3 py-2 font-medium">멤버</th>
                <th className="px-3 py-2 text-right font-medium whitespace-nowrap">
                  도서(권)
                </th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">
                  생성자
                </th>
                <th className="px-3 py-2 text-xs font-normal text-muted-foreground whitespace-nowrap">
                  ID
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/40 last:border-b-0"
                >
                  <td className="align-top px-3 py-3 font-medium">
                    <div>{row.name}</div>
                    {row.description ? (
                      <p className="mt-1 line-clamp-2 text-xs font-normal text-muted-foreground">
                        {row.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="align-top px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {kindLabel(row.kind)}
                  </td>
                  <td className="align-top px-3 py-3">
                    <ul className="space-y-1">
                      {row.members.map((m) => (
                        <li
                          key={m.userId}
                          className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
                        >
                          <span>{m.displayLabel}</span>
                          <span className="text-xs text-muted-foreground">
                            {m.role === "owner" ? "소유" : "멤버"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="align-top px-3 py-3 text-right tabular-nums">
                    {row.distinctBookCount}
                  </td>
                  <td className="align-top px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {row.creatorLabel}
                  </td>
                  <td className="align-top px-3 py-3 font-mono text-xs text-muted-foreground">
                    {row.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
