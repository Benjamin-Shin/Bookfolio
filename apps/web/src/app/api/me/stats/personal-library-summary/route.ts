import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { getPersonalLibrarySummary } from "@/lib/stats/personal-library-summary";

/**
 * 로그인 사용자 종이책 서재 요약(허브·분석 화면 지표).
 *
 * @history
 * - 2026-04-02: 응답에 `topAuthorsByOwnedCount`, `profileForStats` 포함(집계 모듈 연동)
 * - 2026-04-02: 신규
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const summary = await getPersonalLibrarySummary({ userId, useAdmin: true });
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load library summary";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
