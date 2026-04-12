import { NextRequest } from "next/server";

import { auth } from "@/auth";
import { verifyMobileAccessToken } from "@/lib/auth/mobile-jwt";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * 세션·Bearer 모두 실패하면 null (익명 허용 엔드포인트용).
 *
 * @history
 * - 2026-04-10: 신규 — 클라이언트 오류 수집 등
 */
export async function getOptionalRequestUserId(request: NextRequest): Promise<string | null> {
  try {
    return await getRequestUserId(request);
  } catch {
    return null;
  }
}

export async function getRequestUserId(request: NextRequest): Promise<string> {
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }

  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.replace("Bearer ", "");
    const mobileUserId = await verifyMobileAccessToken(token);
    if (mobileUserId) {
      return mobileUserId;
    }

    const admin = createSupabaseAdminClient();
    const {
      data: { user },
      error
    } = await admin.auth.getUser(token);

    if (error || !user) {
      throw new Error("Unauthorized");
    }

    return user.id;
  }

  throw new Error("Unauthorized");
}
