import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { listCanonCommunityOneLiners } from "@/lib/books/canon-community-one-liners";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * 캐논 도서에 대한 공개 한줄평 목록(회원 전용).
 *
 * @history
 * - 2026-04-08: `GET` — `book_one_liners` + `app_profiles`
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bookId: string }> }
) {
  try {
    await getRequestUserId(request);
    const { bookId } = await context.params;
    if (!bookId?.trim()) {
      return NextResponse.json({ error: "bookId가 필요합니다." }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const rawLimit = searchParams.get("limit");
    const limit = rawLimit ? Math.min(100, Math.max(1, Number.parseInt(rawLimit, 10) || 50)) : 50;

    const admin = createSupabaseAdminClient();
    const items = await listCanonCommunityOneLiners(admin, bookId.trim(), limit);
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load one-liners";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
