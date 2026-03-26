import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { listReadingEventsForUtcDayWithBooks } from "@/lib/books/user-book-sidecars";

/**
 * 특정 일(UTC 달력일, `YYYY-MM-DD`)의 독서 이벤트 목록 + 도서 표지·제목.
 *
 * @history
 * - 2026-03-26: 신규 — GET `?day=YYYY-MM-DD`
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const day = request.nextUrl.searchParams.get("day")?.trim() ?? "";
    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return NextResponse.json({ error: "day는 YYYY-MM-DD 형식이어야 합니다." }, { status: 400 });
    }
    const items = await listReadingEventsForUtcDayWithBooks(day, { userId, useAdmin: true });
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load events";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
