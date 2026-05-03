import { NextResponse } from "next/server";

import { auth } from "@/auth";

export type AdminApiOk = { ok: true; userId: string };
export type AdminApiFail = { ok: false; response: NextResponse };

/**
 * API 라우트용 관리자 세션 검증(실패 시 JSON 응답 객체 반환).
 *
 * @history
 * - 2026-05-04: 신규 — 공지 관리 API 등에서 사용
 */
export async function requireAdminApi(): Promise<AdminApiOk | AdminApiFail> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (session.user.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, userId: session.user.id };
}
