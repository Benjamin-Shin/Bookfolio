import { SignJWT, jwtVerify } from "jose";

import { getAuthSecret } from "@/lib/auth/get-auth-secret";

/** 모바일 전용 HS256 JWT; 웹 NextAuth 세션 토큰과 형식이 달라 충돌하지 않습니다. */
export const MOBILE_JWT_ISSUER = "bookfolio-mobile";

export async function signMobileAccessToken(params: { userId: string; email: string }): Promise<string> {
  const secret = new TextEncoder().encode(getAuthSecret());
  return new SignJWT({ email: params.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(params.userId)
    .setIssuedAt()
    .setIssuer(MOBILE_JWT_ISSUER)
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyMobileAccessToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(getAuthSecret()), {
      issuer: MOBILE_JWT_ISSUER,
      algorithms: ["HS256"]
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
