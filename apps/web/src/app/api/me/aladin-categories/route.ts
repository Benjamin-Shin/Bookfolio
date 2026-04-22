import { NextRequest, NextResponse } from "next/server";

import { ALADIN_CATEGORY_OPTIONS } from "@/lib/aladin/categories";
import { getRequestUserId } from "@/lib/auth/request-user";

/**
 * 로그인 사용자용 알라딘 카테고리 목록(JSON).
 *
 * @history
 * - 2026-04-22: 모바일/웹 공통 카테고리 필터 데이터 API 추가
 */
export async function GET(request: NextRequest) {
  try {
    await getRequestUserId(request);
    return NextResponse.json({ items: ALADIN_CATEGORY_OPTIONS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Aladin categories";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

