import { NextRequest, NextResponse } from "next/server";

import {
  AccountDeleteBlockedError,
  deleteAppUserById,
} from "@/lib/auth/delete-app-user";
import { getRequestUserId } from "@/lib/auth/request-user";

/**
 * 본인 계정 및 연관 데이터 물리 삭제(세션·모바일 Bearer 동일).
 *
 * @history
 * - 2026-03-26: 소유 모임서가·멤버 선행 조건 시 409
 * - 2026-03-26: 회원 탈퇴 DELETE
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    await deleteAppUserById(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AccountDeleteBlockedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message =
      error instanceof Error ? error.message : "탈퇴 처리에 실패했습니다.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
