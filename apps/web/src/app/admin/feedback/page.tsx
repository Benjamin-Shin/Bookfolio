import { USER_FEEDBACK_STATUS_LABEL_KO, type UserFeedbackStatus } from "@bookfolio/shared";

import { AdminFeedbackCard } from "@/components/admin/admin-feedback-card";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/require-admin";
import { fetchAdminUserFeedback } from "@/lib/user-feedback/admin-user-feedback";

/**
 * 관리자 — 사용자 피드백 목록.
 *
 * @history
 * - 2026-05-18: 카드형 UI·환경 정보 라벨 그리드·요약 배지
 * - 2026-05-18: 신규
 */
export default async function AdminFeedbackPage() {
  await requireAdmin();

  let rows: Awaited<ReturnType<typeof fetchAdminUserFeedback>> = [];
  let loadError: string | null = null;
  try {
    rows = await fetchAdminUserFeedback(200);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "목록을 불러오지 못했습니다.";
  }

  const statusCounts = { new: 0, read: 0, archived: 0 };
  for (const row of rows) {
    if (row.status === "new" || row.status === "read" || row.status === "archived") {
      statusCounts[row.status as UserFeedbackStatus] += 1;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">사용자 피드백</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          앱·웹 「의견 보내기」로 접수된 항목입니다. 최대 200건, 최신순. 스토어 리뷰와 별도 채널입니다.
        </p>
        {rows.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">전체 {rows.length}</Badge>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
              {USER_FEEDBACK_STATUS_LABEL_KO.new} {statusCounts.new}
            </Badge>
            <Badge variant="outline">
              {USER_FEEDBACK_STATUS_LABEL_KO.read} {statusCounts.read}
            </Badge>
            <Badge variant="outline">
              {USER_FEEDBACK_STATUS_LABEL_KO.archived} {statusCounts.archived}
            </Badge>
          </div>
        ) : null}
      </div>

      {loadError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      {rows.length === 0 && !loadError ? (
        <p className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
          접수된 피드백이 없습니다.
        </p>
      ) : null}

      <div className="space-y-5">
        {rows.map((row) => (
          <AdminFeedbackCard key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
