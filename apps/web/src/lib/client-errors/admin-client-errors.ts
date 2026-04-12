import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminClientErrorRow = {
  id: string;
  created_at: string;
  user_id: string | null;
  platform: string;
  kind: string;
  message: string;
  context: Record<string, unknown>;
};

/**
 * 관리자: 최근 클라이언트 오류 목록.
 *
 * @history
 * - 2026-04-10: 신규
 */
export async function fetchAdminClientErrors(limit: number): Promise<AdminClientErrorRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("client_error_reports")
    .select("id,created_at,user_id,platform,kind,message,context")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (error) {
    throw error;
  }
  return (data ?? []) as AdminClientErrorRow[];
}
