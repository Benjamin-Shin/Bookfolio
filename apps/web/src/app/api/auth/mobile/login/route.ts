import { NextRequest, NextResponse } from "next/server";

import { signMobileAccessToken } from "@/lib/auth/mobile-jwt";
import { verifyAppUserCredentials } from "@/lib/auth/verify-app-user-credentials";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const emailRaw = body.email;
    const password = body.password;
    if (!emailRaw || typeof emailRaw !== "string" || !password || typeof password !== "string") {
      return NextResponse.json({ error: "이메일과 비밀번호가 필요합니다." }, { status: 400 });
    }

    const email = normalizeEmail(emailRaw);
    const user = await verifyAppUserCredentials(email, password);
    if (!user) {
      return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    const accessToken = await signMobileAccessToken({ userId: user.id, email: user.email });
    return NextResponse.json({ accessToken });
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }
}
