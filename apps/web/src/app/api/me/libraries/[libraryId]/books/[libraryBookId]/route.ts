import type { UpdateLibraryBookInput } from "@bookfolio/shared";
import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { deleteLibraryBook, getLibraryBook, updateLibraryBook } from "@/lib/libraries/repository";

function statusForMessage(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message.includes("권한")) return 403;
  if (message === "Not found") return 404;
  return 500;
}

type RouteContext = { params: Promise<{ libraryId: string; libraryBookId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryBookId } = await context.params;
    const book = await getLibraryBook(libraryBookId, userId, { userId, useAdmin: true });
    if (!book) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(book);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryBookId } = await context.params;
    const body = (await request.json()) as UpdateLibraryBookInput;
    const updated = await updateLibraryBook(libraryBookId, body, userId, { userId, useAdmin: true });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryBookId } = await context.params;
    await deleteLibraryBook(libraryBookId, userId, { userId, useAdmin: true });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}
