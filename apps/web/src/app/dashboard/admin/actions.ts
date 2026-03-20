"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

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
