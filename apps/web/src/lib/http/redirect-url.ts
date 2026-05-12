import type { NextRequest } from "next/server";

/**
 * API Route Handler에서 `NextResponse.redirect`에 넘길 절대 URL을 만듭니다.
 * `next dev -H 0.0.0.0` 등으로 접속하면 요청 URL이 `http://0.0.0.0:포트/...`가 되어,
 * 동일 호스트로 리다이렉트할 때 브라우저·OS에서 연결에 실패하는 경우가 있어 호스트를 보정합니다.
 *
 * @history
 * - 2026-05-12: 최초 — `0.0.0.0` → `127.0.0.1`
 */
export function absoluteRedirectUrl(
  request: NextRequest,
  pathnameAndSearch: string,
): URL {
  const path = pathnameAndSearch.startsWith("/")
    ? pathnameAndSearch
    : `/${pathnameAndSearch}`;
  const url = new URL(path, request.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "127.0.0.1";
  }
  return url;
}
