import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { transferLibraryOwnership } from "@/lib/libraries/repository";

/**
 * 공동서재 소유권 이전(현재 소유자만).
 *
 * @history
 * - 2026-03-26: `POST` — body `{ newOwnerUserId }`, 회원 탈퇴 전 정리용
 */
function statusForMessage(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message.includes("권한") || message.includes("소유자")) return 403;
  if (message.includes("이미") || message.includes("멤버가 아닙니다")) return 400;
  return 500;
}

type RouteContext = { params: Promise<{ libraryId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId } = await context.params;
    const body = (await request.json()) as { newOwnerUserId?: string };
    const newOwnerUserId = body.newOwnerUserId?.trim();
    if (!newOwnerUserId) {
      return NextResponse.json({ error: "새 소유자를 선택해 주세요." }, { status: 400 });
    }

    await transferLibraryOwnership(libraryId, newOwnerUserId, userId, { userId, useAdmin: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}
