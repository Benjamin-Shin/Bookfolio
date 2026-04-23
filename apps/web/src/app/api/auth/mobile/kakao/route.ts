import { NextRequest, NextResponse } from "next/server";

import { ensureOAuthAppUser } from "@/lib/auth/app-users";
import { signMobileAccessToken } from "@/lib/auth/mobile-jwt";
import { verifyKakaoAccessTokenForMobile } from "@/lib/auth/verify-kakao-access-token";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * 모바일 카카오 로그인 토큰 교환 엔드포인트.
 *
 * @history
 * - 2026-04-24: 카카오 액세스 토큰 검증(`kapi.kakao.com/v2/user/me`) 후 모바일 JWT 발급 추가
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { accessToken?: string };
    const accessToken = body.accessToken;
    if (!accessToken || typeof accessToken !== "string" || !accessToken.trim()) {
      return NextResponse.json({ error: "accessToken이 필요합니다." }, { status: 400 });
    }

    let profile: { email: string; name?: string; picture?: string };
    try {
      profile = await verifyKakaoAccessTokenForMobile(accessToken.trim());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "KAKAO_EMAIL_SCOPE_REQUIRED") {
        return NextResponse.json(
          { error: "카카오 계정 이메일 동의가 필요합니다. (account_email)" },
          { status: 401 }
        );
      }
      if (msg === "KAKAO_EMAIL_NOT_VERIFIED") {
        return NextResponse.json({ error: "카카오 이메일이 인증되지 않았습니다." }, { status: 401 });
      }
      return NextResponse.json({ error: "카카오 토큰 검증에 실패했습니다." }, { status: 401 });
    }

    const email = normalizeEmail(profile.email);
    const userId = await ensureOAuthAppUser({
      email,
      name: profile.name ?? null,
      image: profile.picture ?? null
    });
    const mobileAccessToken = await signMobileAccessToken({ userId, email });
    return NextResponse.json({ accessToken: mobileAccessToken });
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }
}
