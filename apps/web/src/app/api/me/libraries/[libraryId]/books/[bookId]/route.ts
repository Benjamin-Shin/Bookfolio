import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { getLibraryAggregatedBook, unlinkMyBookFromSharedLibrary } from "@/lib/libraries/repository";

function statusForMessage(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message.includes("권한") || message.includes("소유자")) return 403;
  if (message === "Not found") return 404;
  return 500;
}

type RouteContext = { params: Promise<{ libraryId: string; bookId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId, bookId } = await context.params;
    const book = await getLibraryAggregatedBook(libraryId, bookId, userId, { userId, useAdmin: true });
    if (!book) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(book);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}

/** 이 서재에서 내 소장 연결만 해제(개인 서재의 user_books는 유지). */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId, bookId } = await context.params;
    await unlinkMyBookFromSharedLibrary(libraryId, bookId, userId, { userId, useAdmin: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}
