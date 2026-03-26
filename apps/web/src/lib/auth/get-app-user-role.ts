import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * DB `app_users.role`와 세션 `token.role`에 대응.
 *
 * @history
 * - 2026-03-26: `STAFF` 반영(마이그레이션 0021)
 */
export type AppUserRole = "ADMIN" | "STAFF" | "USER";

export async function getAppUserRole(userId: string): Promise<AppUserRole> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("app_users").select("role").eq("id", userId).maybeSingle();

  if (error || !data || typeof data.role !== "string") {
    return "USER";
  }
  if (data.role === "ADMIN") {
    return "ADMIN";
  }
  if (data.role === "STAFF") {
    return "STAFF";
  }
  return "USER";
}
