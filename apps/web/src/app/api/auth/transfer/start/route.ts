import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { issueMobileLoginTransferCode } from "@/lib/auth/mobile-login-transfer";
import { getRequestUserId } from "@/lib/auth/request-user";

/**
 * 모바일(또는 로그인된 웹) 사용자의 세션 전이용 1회 코드를 발급합니다.
 *
 * @history
 * - 2026-04-26: 신규 — Bearer/세션 인증 사용자에게 웹 로그인 전이 URL 제공
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const body = (await request.json().catch(() => ({}))) as { callbackPath?: string };
    const callbackPathRaw = body.callbackPath;
    const callbackPath =
      typeof callbackPathRaw === "string" &&
      callbackPathRaw.startsWith("/") &&
      !callbackPathRaw.startsWith("//")
        ? callbackPathRaw
        : "/dashboard";

    const { code, expiresIn } = await issueMobileLoginTransferCode(userId);
    const loginUrl = `${env.appUrl}/auth/transfer?code=${encodeURIComponent(code)}&callbackUrl=${encodeURIComponent(callbackPath)}`;

    return NextResponse.json({ code, expiresIn, loginUrl, callbackPath });
  } catch {
    return NextResponse.json({ error: "세션 전이 코드를 발급할 수 없습니다." }, { status: 401 });
  }
}
