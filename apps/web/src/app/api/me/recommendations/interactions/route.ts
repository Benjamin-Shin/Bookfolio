import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { recordUserBookInteraction } from "@/lib/recommendations/service";

type InteractionType =
  | "impression"
  | "click"
  | "detail_view"
  | "save"
  | "dismiss"
  | "start_read"
  | "complete_read"
  | "rate";

const INTERACTION_TYPES = new Set([
  "impression",
  "click",
  "detail_view",
  "save",
  "dismiss",
  "start_read",
  "complete_read",
  "rate"
] as const);

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

/**
 * 추천 관련 사용자 상호작용(클릭/저장/완독 등)을 기록합니다.
 *
 * @history
 * - 2026-04-22: 신규 — 추천 1차 interaction 수집 API
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const body = (await request.json()) as Record<string, unknown>;
    const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    const interactionType = typeof body.interactionType === "string" ? body.interactionType.trim() : "";
    const interactionValue =
      body.interactionValue == null ? null : Number.isFinite(Number(body.interactionValue)) ? Number(body.interactionValue) : null;
    const surface = typeof body.surface === "string" ? body.surface : null;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    const requestId = typeof body.requestId === "string" ? body.requestId : null;
    const occurredAt = typeof body.occurredAt === "string" ? body.occurredAt : null;
    const metadata =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {};

    if (!isUuid(bookId)) {
      return NextResponse.json({ error: "유효하지 않은 bookId입니다." }, { status: 400 });
    }
    if (!INTERACTION_TYPES.has(interactionType as InteractionType)) {
      return NextResponse.json({ error: "유효하지 않은 interactionType입니다." }, { status: 400 });
    }

    await recordUserBookInteraction({
      userId,
      bookId,
      interactionType: interactionType as InteractionType,
      interactionValue,
      surface,
      sessionId,
      requestId,
      metadata,
      occurredAt
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record interaction";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
