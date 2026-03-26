import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { getReadingLeaderboard } from "@/lib/books/user-book-sidecars";

/**
 * 완독·소장 권수 리더보드(`reading_leaderboard` RPC).
 *
 * @history
 * - 2026-03-26: 신규 — GET `?kind=completed|owned&top=20`
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const { searchParams } = new URL(request.url);
    const kindRaw = searchParams.get("kind")?.trim() ?? "completed";
    const kind =
      kindRaw === "owned" || kindRaw === "completed" ? kindRaw : ("completed" as const);
    const top = Math.min(100, Math.max(1, parseInt(searchParams.get("top") ?? "20", 10) || 20));
    const data = await getReadingLeaderboard(kind, top, { userId, useAdmin: true });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load leaderboard";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
