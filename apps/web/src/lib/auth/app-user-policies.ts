import { mergeAppUserPolicies } from "@bookfolio/shared";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * `app_users.policies_json`을 읽어 기본값과 병합합니다.
 *
 * @history
 * - 2026-03-25: `mergeAppUserPolicies` 래핑
 */
export async function getMergedAppUserPoliciesForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("policies_json")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return mergeAppUserPolicies(data?.policies_json);
}
