"use client";

import {
  USER_FEEDBACK_STATUSES,
  USER_FEEDBACK_STATUS_LABEL_KO,
  type UserFeedbackStatus,
} from "@bookfolio/shared";
import { useTransition } from "react";

import { updateFeedbackFromForm } from "@/app/admin/feedback/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FeedbackRowFormProps = {
  id: string;
  status: string;
  adminNote: string | null;
};

/**
 * 관리자 피드백 행 — 상태·메모 저장.
 *
 * @history
 * - 2026-05-18: 카드 푸터 레이아웃·중복 유형 표시 제거
 * - 2026-05-18: 신규
 */
export function FeedbackRowForm({ id, status, adminNote }: FeedbackRowFormProps) {
  const [pending, startTransition] = useTransition();
  const safeStatus = (USER_FEEDBACK_STATUSES as readonly string[]).includes(status)
    ? (status as UserFeedbackStatus)
    : "new";

  return (
    <form
      className="space-y-3"
      action={(formData) => {
        startTransition(() => updateFeedbackFromForm(formData));
      }}
    >
      <input type="hidden" name="id" value={id} />
      <p className="text-xs font-semibold text-foreground">처리</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-[8rem] space-y-1.5">
          <Label htmlFor={`status-${id}`} className="text-xs text-muted-foreground">
            상태
          </Label>
          <select
            id={`status-${id}`}
            name="status"
            defaultValue={safeStatus}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            disabled={pending}
          >
            {USER_FEEDBACK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {USER_FEEDBACK_STATUS_LABEL_KO[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor={`note-${id}`} className="text-xs text-muted-foreground">
            관리자 메모 (내부용)
          </Label>
          <Textarea
            id={`note-${id}`}
            name="adminNote"
            defaultValue={adminNote ?? ""}
            rows={2}
            placeholder="후속 조치, 답변 여부 등"
            className="resize-y bg-background text-sm"
            disabled={pending}
          />
        </div>
        <Button type="submit" size="default" className="shrink-0 sm:mb-0.5" disabled={pending}>
          {pending ? "저장 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}
