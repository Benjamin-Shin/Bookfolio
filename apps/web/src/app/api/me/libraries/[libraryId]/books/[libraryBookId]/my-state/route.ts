import { READING_STATUSES } from "@bookfolio/shared";
import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { upsertMyLibraryBookState } from "@/lib/libraries/repository";

function isReadingStatus(v: unknown): v is (typeof READING_STATUSES)[number] {
  return typeof v === "string" && (READING_STATUSES as readonly string[]).includes(v);
}

function statusForMessage(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message.includes("권한")) return 403;
  if (message === "Not found") return 404;
  return 500;
}

type RouteContext = { params: Promise<{ libraryId: string; libraryBookId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryBookId } = await context.params;
    const body = (await request.json()) as { readingStatus?: string };

    if (!isReadingStatus(body.readingStatus)) {
      return NextResponse.json({ error: "유효한 readingStatus가 필요합니다." }, { status: 400 });
    }

    const updated = await upsertMyLibraryBookState(
      libraryBookId,
      body.readingStatus,
      userId,
      { userId, useAdmin: true }
    );
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}
