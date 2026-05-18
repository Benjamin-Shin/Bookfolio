import {
  USER_FEEDBACK_CATEGORY_LABEL_KO,
  USER_FEEDBACK_STATUSES,
  USER_FEEDBACK_STATUS_LABEL_KO,
  type UserFeedbackCategory,
  type UserFeedbackStatus,
} from "@bookfolio/shared";
import { GlobeIcon, MailIcon, SmartphoneIcon, UserIcon } from "lucide-react";

import { FeedbackRowForm } from "@/app/admin/feedback/feedback-row-form.client";
import { CopyUserIdButton } from "@/app/admin/users/copy-user-id-button.client";
import { FeedbackDeviceInfo } from "@/components/admin/feedback-device-info";
import { Badge } from "@/components/ui/badge";
import type { AdminUserFeedbackRow } from "@/lib/user-feedback/admin-user-feedback";
import { formatFeedbackPlatformLabel } from "@/lib/user-feedback/format-device-info";
import { cn } from "@/lib/utils";

function statusBadgeClass(status: string): string {
  switch (status) {
    case "new":
      return "border-primary/30 bg-primary/10 text-primary";
    case "read":
      return "border-border bg-muted text-muted-foreground";
    case "archived":
      return "border-border/80 bg-background text-muted-foreground";
    default:
      return "";
  }
}

function categoryBadgeClass(category: string): string {
  switch (category) {
    case "bug":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "idea":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
    default:
      return "border-border bg-muted/80 text-foreground";
  }
}

type AdminFeedbackCardProps = {
  row: AdminUserFeedbackRow;
};

/**
 * 관리자 피드백 목록 카드 1건.
 *
 * @history
 * - 2026-05-18: 신규 — 사용자·환경 정보 구조화, JSON raw 제거
 */
export function AdminFeedbackCard({ row }: AdminFeedbackCardProps) {
  const category =
    row.category in USER_FEEDBACK_CATEGORY_LABEL_KO
      ? (row.category as UserFeedbackCategory)
      : "other";
  const categoryLabel = USER_FEEDBACK_CATEGORY_LABEL_KO[category];
  const status = (USER_FEEDBACK_STATUSES as readonly string[]).includes(row.status)
    ? (row.status as UserFeedbackStatus)
    : "new";
  const statusLabel = USER_FEEDBACK_STATUS_LABEL_KO[status];
  const platformLabel = formatFeedbackPlatformLabel(row.platform);
  const created = new Date(row.created_at);

  return (
    <article className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <header className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("font-medium", statusBadgeClass(row.status))}>
            {statusLabel}
          </Badge>
          <Badge variant="outline" className={cn("font-medium", categoryBadgeClass(row.category))}>
            {categoryLabel}
          </Badge>
          <Badge variant="secondary" className="gap-1 font-normal">
            {row.platform === "web" ? (
              <GlobeIcon className="size-3 opacity-60" aria-hidden />
            ) : (
              <SmartphoneIcon className="size-3 opacity-60" aria-hidden />
            )}
            {platformLabel}
          </Badge>
          {row.app_version ? (
            <span className="text-xs text-muted-foreground">v{row.app_version}</span>
          ) : null}
        </div>
        <time
          className="text-xs tabular-nums text-muted-foreground"
          dateTime={created.toISOString()}
        >
          {created.toLocaleString("ko-KR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </time>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,240px)_1fr]">
        <aside className="space-y-3 rounded-lg border border-border/50 bg-muted/10 p-3">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <UserIcon className="size-3.5 opacity-70" aria-hidden />
            제출 회원
          </h3>
          {row.user_email ? (
            <p className="break-all text-sm font-medium text-foreground">{row.user_email}</p>
          ) : row.user_id ? (
            <p className="text-sm text-muted-foreground">로그인 회원 (이메일 없음)</p>
          ) : (
            <p className="text-sm text-muted-foreground">익명</p>
          )}
          {row.user_id ? (
            <div className="flex items-center gap-2">
              <code
                className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 font-mono text-[0.65rem] text-muted-foreground"
                title={row.user_id}
              >
                {row.user_id}
              </code>
              <CopyUserIdButton userId={row.user_id} />
            </div>
          ) : null}
          {row.contact_email ? (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MailIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                <span className="font-medium text-foreground/80">회신 요청</span>
                <br />
                <a
                  href={`mailto:${encodeURIComponent(row.contact_email)}`}
                  className="break-all underline-offset-2 hover:underline"
                >
                  {row.contact_email}
                </a>
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">회신 이메일 없음</p>
          )}
        </aside>

        <div className="min-w-0 space-y-4">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              의견 내용
            </h3>
            <blockquote className="rounded-lg border border-border/50 bg-background px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {row.body}
            </blockquote>
          </section>

          <FeedbackDeviceInfo deviceInfo={row.device_info} />
        </div>
      </div>

      <footer className="border-t border-border/60 bg-muted/10 px-4 py-3">
        <FeedbackRowForm id={row.id} status={row.status} adminNote={row.admin_note} />
      </footer>
    </article>
  );
}
