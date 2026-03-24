"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminAuthorActionState = { error: string | null };

/**
 * 관리자 저자 마스터(`authors`) 생성·이름 수정.
 *
 * @history
 * - 2026-03-24: 최초 추가 (데이터 관리 전용)
 */
export async function createAdminAuthor(
  _prev: AdminAuthorActionState | null,
  formData: FormData
): Promise<AdminAuthorActionState> {
  await requireAdmin();

  const name = formData.get("name")?.toString().trim() ?? "";
  if (!name) {
    return { error: "이름을 입력해 주세요." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("authors").insert({ name });

  if (error) {
    if (error.code === "23505") {
      return { error: "같은 이름(공백·대소문자 무시)의 저자가 이미 있습니다." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/authors");
  return { error: null };
}

/**
 * @history
 * - 2026-03-24: 최초 추가
 */
export async function updateAdminAuthorName(
  _prev: AdminAuthorActionState | null,
  formData: FormData
): Promise<AdminAuthorActionState> {
  await requireAdmin();

  const authorId = formData.get("authorId")?.toString().trim();
  if (!authorId) {
    return { error: "저자 ID가 없습니다." };
  }

  const name = formData.get("name")?.toString().trim() ?? "";
  if (!name) {
    return { error: "이름을 입력해 주세요." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("authors").update({ name }).eq("id", authorId);

  if (error) {
    if (error.code === "23505") {
      return { error: "같은 이름(공백·대소문자 무시)의 저자가 이미 있습니다." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/authors");
  revalidatePath("/dashboard/admin/books");
  return { error: null };
}
