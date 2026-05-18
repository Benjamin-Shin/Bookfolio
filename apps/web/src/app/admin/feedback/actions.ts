"use server";

import { USER_FEEDBACK_STATUSES, type UserFeedbackStatus } from "@bookfolio/shared";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { updateUserFeedbackAdminFields } from "@/lib/user-feedback/admin-user-feedback";

function parseStatus(raw: string): UserFeedbackStatus | null {
  if ((USER_FEEDBACK_STATUSES as readonly string[]).includes(raw)) {
    return raw as UserFeedbackStatus;
  }
  return null;
}

/**
 * 관리자: 피드백 상태·메모 저장.
 *
 * @history
 * - 2026-05-18: 신규
 */
export async function updateFeedbackFromForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id")?.toString().trim() ?? "";
  if (!id) {
    return;
  }
  const statusRaw = formData.get("status")?.toString().trim() ?? "";
  const status = parseStatus(statusRaw);
  const adminNoteRaw = formData.get("adminNote");
  const adminNote =
    adminNoteRaw == null ? undefined : adminNoteRaw.toString().trim() || null;

  await updateUserFeedbackAdminFields(id, {
    ...(status ? { status } : {}),
    ...(adminNoteRaw != null ? { adminNote } : {}),
  });
  revalidatePath("/admin/feedback");
}
