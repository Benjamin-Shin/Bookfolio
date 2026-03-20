const INSECURE_FALLBACK = "__bookfolio_set_AUTH_SECRET_in_env__";

/**
 * Auth.js JWT 서명용 시크릿.
 * `AUTH_SECRET` 또는 `NEXTAUTH_SECRET`을 꼭 설정하는 것을 권장합니다.
 * 미설정 시에도 동작은 하지만(빌드/로컬 편의), 프로덕션에서는 반드시 환경 변수를 넣으세요.
 */
export function getAuthSecret(): string {
  const fromEnv = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[auth] AUTH_SECRET / NEXTAUTH_SECRET 이 없습니다. 임시 시크릿으로 JWT를 서명합니다. " +
        "배포 환경(Vercel 등)에 반드시 `AUTH_SECRET`을 설정하세요."
    );
  } else {
    console.warn(
      "[auth] AUTH_SECRET이 없어 임시 시크릿을 사용합니다. apps/web/.env 에 추가하세요. 예: openssl rand -base64 32"
    );
  }

  return INSECURE_FALLBACK;
}
