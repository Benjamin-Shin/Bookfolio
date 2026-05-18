import type { ParsedUserFeedbackInput } from "@/lib/user-feedback/parse-feedback-input";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * 로그인 사용자 피드백 1건 저장.
 *
 * @history
 * - 2026-05-18: 신규
 */
export async function insertUserFeedback(
  userId: string,
  input: ParsedUserFeedbackInput,
): Promise<{ id: string }> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_feedback")
    .insert({
      user_id: userId,
      platform: input.platform,
      category: input.category,
      body: input.body,
      contact_email: input.contactEmail,
      app_version: input.appVersion,
      device_info: input.deviceInfo,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }
  if (!data?.id) {
    throw new Error("Failed to save feedback");
  }
  return { id: data.id as string };
}
