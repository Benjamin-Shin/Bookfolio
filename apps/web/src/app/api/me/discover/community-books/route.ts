import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { listDiscoverCommunityBooksForUser } from "@/lib/discover/community-books";

/**
 * 발견 탭 — 다른 회원이 추가한 도서(본인 미소장·종이책 캐논).
 *
 * @history
 * - 2026-04-05: `GET` — `list_discover_community_books` RPC
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const { searchParams } = new URL(request.url);
    const rawLimit = searchParams.get("limit");
    const limit = rawLimit ? Math.min(50, Math.max(1, Number.parseInt(rawLimit, 10) || 30)) : 30;
    const books = await listDiscoverCommunityBooksForUser(userId, limit);
    return NextResponse.json({ books });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load community books";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
