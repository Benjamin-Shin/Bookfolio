import type { SharedLibraryMyReadingInput } from "@bookfolio/shared";
import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { updateMySharedLibraryReadingStatus } from "@/lib/libraries/repository";

function statusForMessage(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message.includes("권한") || message.includes("소유자")) return 403;
  if (message === "Not found") return 404;
  return 500;
}

type RouteContext = { params: Promise<{ libraryId: string; bookId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId, bookId } = await context.params;
    const body = (await request.json()) as SharedLibraryMyReadingInput;

    const updated = await updateMySharedLibraryReadingStatus(
      libraryId,
      bookId,
      body.readingStatus,
      userId,
      { userId, useAdmin: true }
    );
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("권한")
          ? 403
          : message.includes("없습니다") || message.includes("올리지")
            ? 400
            : statusForMessage(message);
    return NextResponse.json({ error: message }, { status });
  }
}
