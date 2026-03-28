import type { SupabaseClient } from "@supabase/supabase-js";

function calendarDateInTimeZone(now: Date, ianaTimeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: ianaTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);
  }
}

/**
 * 독서 기록·소장 등록 등 자격 행위 시, 사용자 로컬 달력 기준 일 1회 출석 행을 넣습니다.
 * 이미 해당 일에 기록이 있으면 아무 것도 하지 않습니다.
 *
 * @history
 * - 2026-03-28: 신규 — `user_daily_check_ins`, `app_profiles.iana_timezone` 연동
 */
export async function tryRecordDailyActivityCheckIn(
  supabase: SupabaseClient,
  userId: string
): Promise<{ recorded: boolean; checkDate: string }> {
  const { data: prof, error: pErr } = await supabase
    .from("app_profiles")
    .select("iana_timezone")
    .eq("id", userId)
    .maybeSingle();

  if (pErr) {
    throw pErr;
  }

  const tz = prof?.iana_timezone?.trim() || "UTC";
  const checkDate = calendarDateInTimeZone(new Date(), tz);
  const { error } = await supabase.from("user_daily_check_ins").insert({
    user_id: userId,
    check_date: checkDate,
    first_activity_at: new Date().toISOString()
  });

  if (error?.code === "23505") {
    return { recorded: false, checkDate };
  }
  if (error) {
    throw error;
  }
  return { recorded: true, checkDate };
}
