import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import {
  clearMyCanonBookOneLiner,
  upsertMyCanonBookOneLiner,
} from "@/lib/books/user-book-sidecars";

/**
 * `user_books` 없이 공유 서지(`books.id`)만으로 한줄평 upsert·삭제.
 *
 * @history
 * - 2026-05-04: 모임서가·타인 소장 도서 상세에서 작성 가능하도록 신규
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ bookId: string }> },
) {
  try {
    const userId = await getRequestUserId(request);
    const { bookId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action =
      typeof body.action === "string" ? body.action.trim().toLowerCase() : "";
    const ctx = { userId, useAdmin: true } as const;

    if (action === "clear") {
      await clearMyCanonBookOneLiner(bookId, ctx);
      return new NextResponse(null, { status: 204 });
    }
    if (action === "upsert") {
      const t = typeof body.body === "string" ? body.body : "";
      await upsertMyCanonBookOneLiner(bookId, t, ctx);
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json(
      { error: "action은 upsert 또는 clear 여야 합니다." },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json(
      { error: message },
      {
        status:
          message === "Unauthorized"
            ? 401
            : message === "Not found"
              ? 404
              : 500,
      },
    );
  }
}
