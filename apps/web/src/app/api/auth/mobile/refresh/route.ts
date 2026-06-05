import { NextRequest, NextResponse } from "next/server";

import { signMobileAccessToken, verifyMobileAccessTokenForRefresh } from "@/lib/auth/mobile-jwt";

/**
 * 유효하거나 grace(7일) 이내 만료된 모바일 JWT로 새 30일 토큰을 발급합니다.
 *
 * @history
 * - 2026-06-05: sliding refresh — `iat` 90일 absolute max는 `verifyMobileAccessTokenForRefresh`에서 검사
 */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const verified = await verifyMobileAccessTokenForRefresh(token);
  if (!verified) {
    return NextResponse.json(
      { error: "세션이 만료되었습니다. 다시 로그인해 주세요." },
      { status: 401 }
    );
  }

  const accessToken = await signMobileAccessToken({
    userId: verified.userId,
    email: verified.email
  });
  return NextResponse.json({ accessToken });
}
