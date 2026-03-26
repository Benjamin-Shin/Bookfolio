import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { listBookOneLinersForBook } from "@/lib/books/user-book-sidecars";

/**
 * 책(`books.id`)에 달린 공개 한줄평 목록.
 *
 * @history
 * - 2026-03-26: 신규
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    await getRequestUserId(_request);
    const { bookId } = await params;
    const rows = await listBookOneLinersForBook(bookId);
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load one-liners";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
