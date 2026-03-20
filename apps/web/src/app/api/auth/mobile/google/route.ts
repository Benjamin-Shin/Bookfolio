import { NextRequest, NextResponse } from "next/server";

import { ensureOAuthAppUser } from "@/lib/auth/app-users";
import { signMobileAccessToken } from "@/lib/auth/mobile-jwt";
import { getGoogleMobileJwtAudiences } from "@/lib/auth/google-mobile-audiences";
import { verifyGoogleIdTokenForMobile } from "@/lib/auth/verify-google-id-token";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  if (getGoogleMobileJwtAudiences().length === 0) {
    return NextResponse.json(
      { error: "서버에 Google 모바일 로그인이 설정되지 않았습니다. (AUTH_GOOGLE_ID 또는 AUTH_GOOGLE_MOBILE_AUDIENCES)" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as { idToken?: string };
    const idToken = body.idToken;
    if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
      return NextResponse.json({ error: "idToken이 필요합니다." }, { status: 400 });
    }

    let profile: { email: string; name?: string; picture?: string };
    try {
      profile = await verifyGoogleIdTokenForMobile(idToken.trim());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "GOOGLE_MOBILE_AUTH_NOT_CONFIGURED") {
        return NextResponse.json({ error: "Google 모바일 로그인이 설정되지 않았습니다." }, { status: 503 });
      }
      if (msg === "GOOGLE_TOKEN_MISSING_EMAIL" || msg === "GOOGLE_EMAIL_NOT_VERIFIED") {
        return NextResponse.json({ error: "Google 계정 이메일을 확인할 수 없습니다." }, { status: 401 });
      }
      return NextResponse.json({ error: "Google 토큰 검증에 실패했습니다." }, { status: 401 });
    }

    const email = normalizeEmail(profile.email);
    const userId = await ensureOAuthAppUser({
      email,
      name: profile.name ?? null,
      image: profile.picture ?? null
    });
    const accessToken = await signMobileAccessToken({ userId, email });
    return NextResponse.json({ accessToken });
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }
}
