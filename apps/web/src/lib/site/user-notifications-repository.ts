import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type UserNotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  kind: "info" | "success" | "warning" | "system";
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

/**
 * @history
 * - 2026-05-04: 신규
 */
export async function countUnreadUserNotifications(userId: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("user_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

/**
 * @history
 * - 2026-05-04: 신규
 */
export async function listUserNotifications(
  userId: string,
  limit = 50,
): Promise<UserNotificationRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_notifications")
    .select("id, user_id, title, body, kind, read_at, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    ...row,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    kind: row.kind as UserNotificationRow["kind"],
  }));
}

/**
 * @history
 * - 2026-05-04: 신규
 */
export async function markUserNotificationRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: nowIso })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * @history
 * - 2026-05-04: 신규
 */
export async function markAllUserNotificationsRead(userId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: nowIso })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export type InsertUserNotificationInput = {
  userId: string;
  title: string;
  body: string;
  kind: UserNotificationRow["kind"];
  metadata?: Record<string, unknown>;
};

/**
 * 개인 알림 1건 삽입. 전역 공지(`site_announcements`)와 무관합니다.
 *
 * @history
 * - 2026-05-04: 신규 — 관리자 발송
 */
export async function insertUserNotification(
  input: InsertUserNotificationInput,
): Promise<UserNotificationRow> {
  const supabase = createSupabaseAdminClient();
  const meta = { ...(input.metadata ?? {}) };
  const { data, error } = await supabase
    .from("user_notifications")
    .insert({
      user_id: input.userId,
      title: input.title,
      body: input.body,
      kind: input.kind,
      metadata: meta,
    })
    .select("id, user_id, title, body, kind, read_at, metadata, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "insert failed");
  }

  return {
    ...data,
    metadata: (data.metadata as Record<string, unknown>) ?? {},
    kind: data.kind as UserNotificationRow["kind"],
  };
}
