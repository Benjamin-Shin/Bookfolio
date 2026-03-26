import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { getReadingEventsCalendar } from "@/lib/books/user-book-sidecars";

/**
 * 독서 이벤트 일별 집계(`user_reading_events_calendar` RPC).
 *
 * @history
 * - 2026-03-26: 신규 — GET `?from=YYYY-MM-DD&to=YYYY-MM-DD`
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();
    if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !to || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return NextResponse.json({ error: "from, to는 YYYY-MM-DD 형식이어야 합니다." }, { status: 400 });
    }
    const data = await getReadingEventsCalendar(from, to, { userId, useAdmin: true });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load calendar";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
