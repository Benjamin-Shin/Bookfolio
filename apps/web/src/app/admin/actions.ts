"use server";

import { revalidatePath } from "next/cache";

import { upsertAppProfileRow } from "@/lib/auth/app-profiles";
import { appUserExistsById } from "@/lib/auth/app-users";
import { requireAdmin } from "@/lib/auth/require-admin";
import { insertUserNotification } from "@/lib/site/user-notifications-repository";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ADMIN_DISPLAY_NAME_MAX_LEN = 200;

const TARGET_USER_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 관리자 사용자 행에서 표시명(`app_profiles`)과 권한(`app_users.role`)을 한 번에 저장합니다.
 *
 * @history
 * - 2026-05-04: 신규 — 사용자 목록 이름·권한 저장 일원화
 */
export async function saveUserDisplayNameAndRoleFromForm(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const userId = formData.get("userId")?.toString().trim();
  const nameRaw = formData.get("displayName")?.toString() ?? "";
  const roleRaw = formData.get("role")?.toString().trim();

  if (
    !userId ||
    (roleRaw !== "ADMIN" && roleRaw !== "STAFF" && roleRaw !== "USER")
  ) {
    return;
  }

  const trimmed = nameRaw.trim().slice(0, ADMIN_DISPLAY_NAME_MAX_LEN);
  const displayName = trimmed.length > 0 ? trimmed : null;

  try {
    await upsertAppProfileRow(userId, { displayName });
  } catch (e) {
    console.error("saveUserDisplayNameAndRoleFromForm profile", e);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("app_users")
    .update({ role: roleRaw })
    .eq("id", userId);

  if (error) {
    console.error("saveUserDisplayNameAndRoleFromForm role", error);
    return;
  }

  revalidatePath("/admin/users");
}

export type AdminUserNotificationFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type PersonalNotifyKind = "info" | "success" | "warning" | "system";

const PERSONAL_NOTIFY_KINDS: readonly PersonalNotifyKind[] = [
  "info",
  "success",
  "warning",
  "system",
];

function parsePersonalNotifyKind(raw: string): PersonalNotifyKind | null {
  const t = raw.trim();
  return PERSONAL_NOTIFY_KINDS.includes(t as PersonalNotifyKind)
    ? (t as PersonalNotifyKind)
    : null;
}

/**
 * 관리자 사용자 목록에서 특정 `userId`로 개인 알림(`user_notifications`) 1건 생성.
 *
 * @history
 * - 2026-05-04: 신규 — 사용자 행 다이얼로그·`useActionState`
 */
export async function sendPersonalNotificationToUserAction(
  _prev: AdminUserNotificationFormState,
  formData: FormData,
): Promise<AdminUserNotificationFormState> {
  const session = await requireAdmin();

  const userId = formData.get("userId")?.toString().trim() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const body = formData.get("body")?.toString().trim() ?? "";
  const kind = parsePersonalNotifyKind(formData.get("kind")?.toString() ?? "info");

  if (!title || !body) {
    return { status: "error", message: "제목과 본문을 입력하세요." };
  }
  if (!kind) {
    return { status: "error", message: "알림 종류가 올바르지 않습니다." };
  }
  if (!TARGET_USER_UUID_RE.test(userId)) {
    return { status: "error", message: "사용자 ID가 올바르지 않습니다." };
  }

  try {
    const exists = await appUserExistsById(userId);
    if (!exists) {
      return { status: "error", message: "존재하지 않는 사용자입니다." };
    }

    await insertUserNotification({
      userId,
      title,
      body,
      kind,
      metadata: {
        source: "admin_users_panel",
        sent_by: session.user.id,
      },
    });

    return {
      status: "success",
      message: "전송했습니다. 수신자는 헤더 알림에서 확인할 수 있습니다.",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "전송에 실패했습니다.";
    return { status: "error", message: msg };
  }
}

/**
 * 활성 VIP 구독을 모두 취소 처리합니다(`status = canceled`).
 *
 * @history
 * - 2026-05-04: 신규 — 사용자 목록 작업 열
 */
export async function adminRevokeUserVipFromForm(formData: FormData): Promise<void> {
  await requireAdmin();

  const targetUserId = formData.get("targetUserId")?.toString().trim() ?? "";
  if (!TARGET_USER_UUID_RE.test(targetUserId)) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("user_subscriptions")
    .update({ status: "canceled" })
    .eq("user_id", targetUserId)
    .eq("status", "active");

  if (error) {
    console.error("adminRevokeUserVipFromForm", error);
    return;
  }

  revalidatePath("/admin/users");
}
