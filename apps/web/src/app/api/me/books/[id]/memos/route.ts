import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import {
  createUserBookMemo,
  deleteUserBookMemo,
  listUserBookMemos,
  updateUserBookMemo
} from "@/lib/books/user-book-sidecars";

/**
 * 개인 메모(마크다운) 다건 CRUD — POST만 사용.
 *
 * @history
 * - 2026-03-26: 신규
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getRequestUserId(request);
    const { id: userBookId } = await context.params;
    const rows = await listUserBookMemos(userBookId, { userId, useAdmin: true });
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load memos";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getRequestUserId(request);
    const { id: userBookId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action.trim().toLowerCase() : "";

    if (action === "create") {
      const md = typeof body.bodyMd === "string" ? body.bodyMd : "";
      const row = await createUserBookMemo(userBookId, md, { userId, useAdmin: true });
      return NextResponse.json(row, { status: 201 });
    }
    if (action === "update") {
      const memoId = typeof body.id === "string" ? body.id : "";
      const md = typeof body.bodyMd === "string" ? body.bodyMd : "";
      if (!memoId) {
        return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
      }
      const row = await updateUserBookMemo(userBookId, memoId, md, { userId, useAdmin: true });
      return NextResponse.json(row);
    }
    if (action === "delete") {
      const memoId = typeof body.id === "string" ? body.id : "";
      if (!memoId) {
        return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
      }
      await deleteUserBookMemo(userBookId, memoId, { userId, useAdmin: true });
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json(
      { error: "action은 create, update, delete 중 하나여야 합니다." },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : message === "Not found" ? 404 : 500 }
    );
  }
}
