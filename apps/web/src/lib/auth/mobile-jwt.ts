import { SignJWT, jwtVerify } from "jose";

import { getAuthSecret } from "@/lib/auth/get-auth-secret";

/** 모바일 전용 HS256 JWT; 웹 NextAuth 세션 토큰과 형식이 달라 충돌하지 않습니다. */
export const MOBILE_JWT_ISSUER = "bookfolio-mobile";

/** 액세스 토큰 TTL. Flutter `jwt_claims.dart` 주석과 맞출 것. */
export const MOBILE_JWT_ACCESS_TTL = "30d";

/** 만료 후 refresh 허용 grace(초). Flutter `jwt_claims.dart`와 동일. */
export const MOBILE_JWT_REFRESH_GRACE_SECONDS = 7 * 24 * 60 * 60;

/** 최초 발급(`iat`) 기준 절대 세션 상한(초). Flutter `jwt_claims.dart`와 동일. */
export const MOBILE_JWT_ABSOLUTE_MAX_SECONDS = 90 * 24 * 60 * 60;

export async function signMobileAccessToken(params: { userId: string; email: string }): Promise<string> {
  const secret = new TextEncoder().encode(getAuthSecret());
  return new SignJWT({ email: params.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(params.userId)
    .setIssuedAt()
    .setIssuer(MOBILE_JWT_ISSUER)
    .setExpirationTime(MOBILE_JWT_ACCESS_TTL)
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

/**
 * refresh 전용 검증 — 서명·issuer 확인, `exp`는 grace만큼 연장, `iat` 90일 상한.
 *
 * @history
 * - 2026-06-05: sliding refresh API용
 */
export async function verifyMobileAccessTokenForRefresh(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(getAuthSecret()), {
      issuer: MOBILE_JWT_ISSUER,
      algorithms: ["HS256"],
      clockTolerance: MOBILE_JWT_REFRESH_GRACE_SECONDS
    });
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const iat = typeof payload.iat === "number" ? payload.iat : null;
    if (!sub || !email) {
      return null;
    }
    if (iat != null && Math.floor(Date.now() / 1000) > iat + MOBILE_JWT_ABSOLUTE_MAX_SECONDS) {
      return null;
    }
    return { userId: sub, email };
  } catch {
    return null;
  }
}
