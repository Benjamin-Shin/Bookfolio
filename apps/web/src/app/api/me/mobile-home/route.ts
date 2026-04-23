import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { buildMobileHomeBundle } from "@/lib/mobile/mobile-home-bundle";

/**
 * 모바일 홈 탭용 묶음 조회 (프로필·서가 요약·포인트·읽는 중·읽기 전 샘플).
 *
 * @history
 * - 2026-04-12: 신규
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const payload = await buildMobileHomeBundle(userId);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load mobile home";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
