import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import {
  cancelLibraryEvent,
  createLibraryEvent,
  deleteLibraryEvent,
  listLibraryEventsInRange,
  updateLibraryEvent,
  utcRangeFromInclusiveYmds,
} from "@/lib/libraries/library-events";

import type { LibraryEventKind } from "@bookfolio/shared";
import { LIBRARY_EVENT_KINDS } from "@bookfolio/shared";

type RouteContext = { params: Promise<{ libraryId: string }> };

function isYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isEventKind(v: unknown): v is LibraryEventKind {
  return typeof v === "string" && (LIBRARY_EVENT_KINDS as readonly string[]).includes(v);
}

/**
 * 모임서가 일정 목록(`GET ?from=&to=`) 및 변경(`POST` + `action`).
 *
 * @history
 * - 2026-05-04: 응답 본문 각 `LibraryEventSummary.rsvpTally` 포함
 * - 2026-05-03: 신규 — `list_library_events_in_range`·생성·수정·취소·삭제
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId } = await context.params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from")?.trim() ?? "";
    const to = searchParams.get("to")?.trim() ?? "";
    if (!isYmd(from) || !isYmd(to)) {
      return NextResponse.json(
        { error: "from, to는 YYYY-MM-DD 형식이어야 합니다." },
        { status: 400 },
      );
    }
    if (from > to) {
      return NextResponse.json(
        { error: "from은 to보다 늦을 수 없습니다." },
        { status: 400 },
      );
    }
    const { rangeStartIso, rangeEndExclusiveIso } = utcRangeFromInclusiveYmds(from, to);
    const items = await listLibraryEventsInRange(
      libraryId,
      userId,
      rangeStartIso,
      rangeEndExclusiveIso,
      { userId, useAdmin: true },
    );
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("권한")
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "create") {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const startsAt = typeof body.startsAt === "string" ? body.startsAt.trim() : "";
      if (!title || !startsAt) {
        return NextResponse.json(
          { error: "title과 startsAt은 필수입니다." },
          { status: 400 },
        );
      }
      const eventKind = isEventKind(body.eventKind) ? body.eventKind : undefined;
      const row = await createLibraryEvent(
        libraryId,
        {
          title,
          startsAt,
          description: typeof body.description === "string" ? body.description : null,
          location: typeof body.location === "string" ? body.location : null,
          endsAt:
            typeof body.endsAt === "string" || body.endsAt === null
              ? (body.endsAt as string | null)
              : undefined,
          eventKind,
        },
        userId,
        { userId, useAdmin: true },
      );
      return NextResponse.json(row, { status: 201 });
    }

    if (action === "update") {
      const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
      if (!eventId) {
        return NextResponse.json({ error: "eventId가 필요합니다." }, { status: 400 });
      }
      const patch: Parameters<typeof updateLibraryEvent>[1] = { eventId };
      if (typeof body.title === "string") patch.title = body.title;
      if (typeof body.description === "string" || body.description === null) {
        patch.description = body.description as string | null;
      }
      if (typeof body.location === "string" || body.location === null) {
        patch.location = body.location as string | null;
      }
      if (isEventKind(body.eventKind)) patch.eventKind = body.eventKind;
      if (typeof body.startsAt === "string") patch.startsAt = body.startsAt;
      if (typeof body.endsAt === "string" || body.endsAt === null) {
        patch.endsAt = body.endsAt as string | null;
      }
      const row = await updateLibraryEvent(libraryId, patch, userId, {
        userId,
        useAdmin: true,
      });
      return NextResponse.json(row);
    }

    if (action === "cancel") {
      const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
      if (!eventId) {
        return NextResponse.json({ error: "eventId가 필요합니다." }, { status: 400 });
      }
      const row = await cancelLibraryEvent(libraryId, eventId, userId, {
        userId,
        useAdmin: true,
      });
      return NextResponse.json(row);
    }

    if (action === "delete") {
      const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
      if (!eventId) {
        return NextResponse.json({ error: "eventId가 필요합니다." }, { status: 400 });
      }
      await deleteLibraryEvent(libraryId, eventId, userId, { userId, useAdmin: true });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "action은 create, update, cancel, delete 중 하나여야 합니다." },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("권한") || message.includes("소유자")
          ? 403
          : message.includes("찾을 수")
            ? 400
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
