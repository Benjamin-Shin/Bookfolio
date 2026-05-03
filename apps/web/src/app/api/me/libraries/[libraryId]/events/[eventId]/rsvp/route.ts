import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { setLibraryEventRsvp } from "@/lib/libraries/library-events";

import type { LibraryEventRsvpStatus } from "@bookfolio/shared";
import { LIBRARY_EVENT_RSVP_STATUSES } from "@bookfolio/shared";

type RouteContext = { params: Promise<{ libraryId: string; eventId: string }> };

function isRsvpStatus(v: unknown): v is LibraryEventRsvpStatus {
  return (
    typeof v === "string" &&
    (LIBRARY_EVENT_RSVP_STATUSES as readonly string[]).includes(v)
  );
}

/**
 * 모임 일정 RSVP 설정(`POST` + `status`).
 *
 * @history
 * - 2026-05-03: 신규
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId, eventId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    if (!isRsvpStatus(body.status)) {
      return NextResponse.json(
        {
          error: `status는 ${LIBRARY_EVENT_RSVP_STATUSES.join(", ")} 중 하나여야 합니다.`,
        },
        { status: 400 },
      );
    }
    await setLibraryEventRsvp(libraryId, eventId, body.status, userId, {
      userId,
      useAdmin: true,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("권한")
          ? 403
          : message.includes("찾을 수")
            ? 400
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
