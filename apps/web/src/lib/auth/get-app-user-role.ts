import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AppUserRole = "ADMIN" | "USER";

export async function getAppUserRole(userId: string): Promise<AppUserRole> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("app_users").select("role").eq("id", userId).maybeSingle();

  if (error || !data || typeof data.role !== "string") {
    return "USER";
  }
  return data.role === "ADMIN" ? "ADMIN" : "USER";
}
