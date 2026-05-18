import type { UserFeedbackStatus } from "@bookfolio/shared";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminUserFeedbackRow = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  user_email: string | null;
  platform: string;
  category: string;
  body: string;
  contact_email: string | null;
  app_version: string | null;
  device_info: Record<string, unknown>;
  status: string;
  admin_note: string | null;
};

type FeedbackDbRow = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  platform: string;
  category: string;
  body: string;
  contact_email: string | null;
  app_version: string | null;
  device_info: Record<string, unknown> | null;
  status: string;
  admin_note: string | null;
  app_users: { email: string } | { email: string }[] | null;
};

/**
 * 관리자: 최근 사용자 피드백 목록.
 *
 * @history
 * - 2026-05-18: 신규
 */
export async function fetchAdminUserFeedback(limit: number): Promise<AdminUserFeedbackRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_feedback")
    .select(
      "id,created_at,updated_at,user_id,platform,category,body,contact_email,app_version,device_info,status,admin_note,app_users(email)",
    )
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (error) {
    throw error;
  }

  return ((data ?? []) as FeedbackDbRow[]).map((row) => {
    const u = row.app_users;
    const email =
      u == null
        ? null
        : Array.isArray(u)
          ? (u[0]?.email ?? null)
          : u.email;
    return {
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_id: row.user_id,
      user_email: email,
      platform: row.platform,
      category: row.category,
      body: row.body,
      contact_email: row.contact_email,
      app_version: row.app_version,
      device_info: (row.device_info ?? {}) as Record<string, unknown>,
      status: row.status,
      admin_note: row.admin_note,
    };
  });
}

/**
 * 관리자: 피드백 상태·메모 갱신.
 *
 * @history
 * - 2026-05-18: 신규
 */
export async function updateUserFeedbackAdminFields(
  id: string,
  fields: { status?: UserFeedbackStatus; adminNote?: string | null },
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (fields.status != null) {
    patch.status = fields.status;
  }
  if (Object.prototype.hasOwnProperty.call(fields, "adminNote")) {
    patch.admin_note = fields.adminNote;
  }
  if (Object.keys(patch).length === 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("user_feedback").update(patch).eq("id", id);
  if (error) {
    throw error;
  }
}
