import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { clearMyBookOneLiner, upsertMyBookOneLiner } from "@/lib/books/user-book-sidecars";

/**
 * 내 `user_books` 행 기준 한줄평 upsert·삭제.
 *
 * @history
 * - 2026-03-26: 신규 — POST + JSON `action: upsert | clear`
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getRequestUserId(request);
    const { id: userBookId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action.trim().toLowerCase() : "";
    if (action === "clear") {
      await clearMyBookOneLiner(userBookId, { userId, useAdmin: true });
      return new NextResponse(null, { status: 204 });
    }
    if (action === "upsert") {
      const t = typeof body.body === "string" ? body.body : "";
      await upsertMyBookOneLiner(userBookId, t, { userId, useAdmin: true });
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json({ error: "action은 upsert 또는 clear 여야 합니다." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : message === "Not found" ? 404 : 500 }
    );
  }
}
