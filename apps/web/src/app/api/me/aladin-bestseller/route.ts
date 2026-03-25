import { NextRequest, NextResponse } from "next/server";

import { fetchAladinBestsellerFeed } from "@/lib/aladin/bestseller-feed";
import { getRequestUserId } from "@/lib/auth/request-user";
import { env } from "@/lib/env";

/**
 * 로그인 사용자용 알라딘 목록(JSON). 모바일 앱이 동일 데이터를 씁니다.
 *
 * @history
 * - 2026-03-25: `GET` — `ALADIN_BESTSELLER_API_BASE_URL` 프록시·XML/JSON 파싱
 */
export async function GET(request: NextRequest) {
  try {
    await getRequestUserId(request);
    const url = env.aladinBestsellerApiBaseUrl;
    if (!url) {
      return NextResponse.json(
        { error: "ALADIN_BESTSELLER_API_BASE_URL is not configured" },
        { status: 503 }
      );
    }
    const data = await fetchAladinBestsellerFeed(url);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Aladin list";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
