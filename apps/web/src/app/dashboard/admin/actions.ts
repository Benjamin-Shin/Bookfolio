"use server";

import { revalidatePath } from "next/cache";

import { upsertAppProfileRow } from "@/lib/auth/app-profiles";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ADMIN_DISPLAY_NAME_MAX_LEN = 200;

/**
 * 관리자 사용자 목록 폼에서 표시명을 저장합니다.
 * `app_profiles.display_name`과 `app_users.name`을 `upsertAppProfileRow`로 동기화합니다.
 *
 * @history
 * - 2026-03-24: 관리자 화면 인라인 이름 수정용 서버 액션 추가
 */
export async function setUserDisplayNameFromForm(formData: FormData): Promise<void> {
  await requireAdmin();

  const userId = formData.get("userId")?.toString().trim();
  const nameRaw = formData.get("displayName")?.toString() ?? "";
  if (!userId) {
    return;
  }

  const trimmed = nameRaw.trim().slice(0, ADMIN_DISPLAY_NAME_MAX_LEN);
  const displayName = trimmed.length > 0 ? trimmed : null;

  try {
    await upsertAppProfileRow(userId, { displayName });
  } catch (e) {
    console.error("setUserDisplayNameFromForm", e);
    return;
  }

  revalidatePath("/dashboard/admin/users");
}

export async function setUserRoleFromForm(formData: FormData): Promise<void> {
  await requireAdmin();

  const userId = formData.get("userId")?.toString().trim();
  const roleRaw = formData.get("role")?.toString().trim();
  if (!userId || (roleRaw !== "ADMIN" && roleRaw !== "USER")) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("app_users").update({ role: roleRaw }).eq("id", userId);
  if (error) {
    console.error("setUserRoleFromForm", error);
    return;
  }

  revalidatePath("/dashboard/admin/users");
}
