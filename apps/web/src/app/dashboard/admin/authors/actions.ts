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

export type DeleteZeroBookAuthorsResult = { error: string | null; deleted: number };

/**
 * `book_authors`에 링크가 없는 저자만 삭제합니다. 다른 요청이 그사이에 링크를 만들면 해당 행은 제외되거나 삭제 단계에서 오류가 날 수 있습니다.
 *
 * @history
 * - 2026-03-24: 연결 도서 0인 저자 일괄 삭제 (관리자 정리용)
 */
export async function deleteAdminAuthorsWithZeroBooks(): Promise<DeleteZeroBookAuthorsResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();

  const { data: linkRows, error: linksErr } = await supabase.from("book_authors").select("author_id");
  if (linksErr) {
    return { error: linksErr.message, deleted: 0 };
  }

  const linked = new Set((linkRows ?? []).map((r: { author_id: string }) => r.author_id));

  const { data: allRows, error: allErr } = await supabase.from("authors").select("id");
  if (allErr) {
    return { error: allErr.message, deleted: 0 };
  }

  const orphanIds = (allRows ?? []).filter((r: { id: string }) => !linked.has(r.id)).map((r: { id: string }) => r.id);

  if (orphanIds.length === 0) {
    revalidatePath("/dashboard/admin/authors");
    return { error: null, deleted: 0 };
  }

  const chunkSize = 200;
  let deleted = 0;
  for (let i = 0; i < orphanIds.length; i += chunkSize) {
    const chunk = orphanIds.slice(i, i + chunkSize);
    const { error } = await supabase.from("authors").delete().in("id", chunk);
    if (error) {
      return { error: error.message, deleted };
    }
    deleted += chunk.length;
  }

  revalidatePath("/dashboard/admin/authors");
  revalidatePath("/dashboard/admin/books");
  return { error: null, deleted };
}
