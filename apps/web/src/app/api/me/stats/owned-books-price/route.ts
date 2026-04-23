import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { getUserOwnedBooksPriceStats } from "@/lib/books/repository";

/**
 * 로그인 사용자 소장 도서 가격 집계(`user_owned_books_price_stats` RPC).
 *
 * @history
 * - 2026-03-29: 신규 — 모바일 내 서가와 웹 대시보드 동일 지표 노출용 GET
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getRequestUserId(req);
    const stats = await getUserOwnedBooksPriceStats({ userId, useAdmin: true });
    return NextResponse.json(stats);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load price stats";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
