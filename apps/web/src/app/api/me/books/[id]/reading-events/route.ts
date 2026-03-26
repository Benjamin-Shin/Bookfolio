import { NextRequest, NextResponse } from "next/server";

import type { ReadingEventType, ReadingStatus } from "@bookfolio/shared";
import { READING_EVENT_TYPES, READING_STATUSES } from "@bookfolio/shared";

import { getRequestUserId } from "@/lib/auth/request-user";
import {
  appendUserBookReadingEvent,
  listUserBookReadingEvents
} from "@/lib/books/user-book-sidecars";

function isReadingEventType(s: string): s is ReadingEventType {
  return (READING_EVENT_TYPES as readonly string[]).includes(s);
}

/**
 * 독서 이벤트 타임라인.
 *
 * @history
 * - 2026-03-26: 신규
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getRequestUserId(request);
    const { id: userBookId } = await context.params;
    void request;
    const rows = await listUserBookReadingEvents(userBookId, { userId, useAdmin: true });
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load events";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getRequestUserId(request);
    const { id: userBookId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action.trim().toLowerCase() : "";
    if (action !== "append") {
      return NextResponse.json({ error: "action은 append 여야 합니다." }, { status: 400 });
    }
    const et = typeof body.eventType === "string" ? body.eventType.trim() : "";
    if (!isReadingEventType(et)) {
      return NextResponse.json({ error: "유효하지 않은 eventType입니다." }, { status: 400 });
    }
    const payload =
      body.payload !== null &&
      body.payload !== undefined &&
      typeof body.payload === "object" &&
      !Array.isArray(body.payload)
        ? (body.payload as Record<string, unknown>)
        : {};
    let setReadingStatus: ReadingStatus | undefined;
    if (typeof body.setReadingStatus === "string") {
      const s = body.setReadingStatus.trim();
      if ((READING_STATUSES as readonly string[]).includes(s)) {
        setReadingStatus = s as ReadingStatus;
      }
    }
    const occurredAt = typeof body.occurredAt === "string" ? body.occurredAt : undefined;
    const row = await appendUserBookReadingEvent(userBookId, et, payload, { userId, useAdmin: true }, {
      setReadingStatus,
      occurredAt
    });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : message === "Not found" ? 404 : 500 }
    );
  }
}
