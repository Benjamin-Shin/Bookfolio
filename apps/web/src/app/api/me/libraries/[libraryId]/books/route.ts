import type { CreateLibraryBookInput } from "@bookfolio/shared";
import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { addLibraryBook, listLibraryBooks } from "@/lib/libraries/repository";

function statusForMessage(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message.includes("권한") || message.includes("소유자")) return 403;
  if (message === "Not found") return 404;
  return 500;
}

type RouteContext = { params: Promise<{ libraryId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId } = await context.params;
    const items = await listLibraryBooks(libraryId, userId, { userId, useAdmin: true });
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId } = await context.params;
    const body = (await request.json()) as CreateLibraryBookInput;

    const created = await addLibraryBook(libraryId, body, userId, { userId, useAdmin: true });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("권한")
          ? 403
          : message.includes("입력") || message.includes("찾을 수 없")
            ? 400
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
