import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { getBookfolioAggregate } from "@/lib/stats/bookfolio-aggregate";

/**
 * 북폴리오 집계 TOP N(소장·완독·포인트 회원 순위 + 다중 소장 도서).
 *
 * @history
 * - 2026-03-28: 신규 — GET `?top=10`
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const { searchParams } = new URL(request.url);
    const top = Math.min(100, Math.max(1, parseInt(searchParams.get("top") ?? "10", 10) || 10));
    const data = await getBookfolioAggregate(top, { userId, useAdmin: true });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load aggregate stats";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
