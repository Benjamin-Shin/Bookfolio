import { createRemoteJWKSet, jwtVerify } from "jose";

import { getGoogleMobileJwtAudiences } from "@/lib/auth/google-mobile-audiences";

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type GoogleIdTokenProfile = {
  email: string;
  name?: string;
  picture?: string;
};

function isEmailVerifiedClaim(value: unknown): boolean {
  return value === true || value === "true";
}

export async function verifyGoogleIdTokenForMobile(idToken: string): Promise<GoogleIdTokenProfile> {
  const audiences = getGoogleMobileJwtAudiences();
  if (audiences.length === 0) {
    throw new Error("GOOGLE_MOBILE_AUTH_NOT_CONFIGURED");
  }

  const { payload } = await jwtVerify(idToken, googleJwks, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: audiences,
    algorithms: ["RS256"]
  });

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (!email) {
    throw new Error("GOOGLE_TOKEN_MISSING_EMAIL");
  }
  if (!isEmailVerifiedClaim(payload.email_verified)) {
    throw new Error("GOOGLE_EMAIL_NOT_VERIFIED");
  }

  return {
    email,
    ...(typeof payload.name === "string" && payload.name.trim() !== ""
      ? { name: payload.name.trim() }
      : {}),
    ...(typeof payload.picture === "string" && payload.picture.trim() !== ""
      ? { picture: payload.picture.trim() }
      : {})
  };
}
