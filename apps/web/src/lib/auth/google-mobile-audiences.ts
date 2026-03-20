/** 모바일 Google 로그인 시 ID 토큰의 aud 로 허용할 OAuth 클라이언트 ID 목록 */
export function getGoogleMobileJwtAudiences(): string[] {
  const ids = new Set<string>();
  const web = process.env.AUTH_GOOGLE_ID?.trim();
  if (web) ids.add(web);
  const extra = process.env.AUTH_GOOGLE_MOBILE_AUDIENCES?.trim();
  if (extra) {
    for (const part of extra.split(",")) {
      const s = part.trim();
      if (s) ids.add(s);
    }
  }
  return [...ids];
}
