import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { listUserBookTags } from "@/lib/books/repository";

/**
 * GET /api/me/book-tags — 내 서가에 쓰인 사용자 태그 목록.
 *
 * @history
 * - 2026-05-24: `user_books.tags` 필터 칩·자동완성용
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const tags = await listUserBookTags({ userId, useAdmin: true });
    return NextResponse.json(tags);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load book tags";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
