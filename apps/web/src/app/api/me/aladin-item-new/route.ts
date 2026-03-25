import { NextRequest, NextResponse } from "next/server";

import { fetchAladinBestsellerFeed } from "@/lib/aladin/bestseller-feed";
import { getRequestUserId } from "@/lib/auth/request-user";
import { env } from "@/lib/env";

/**
 * 로그인 사용자용 알라딘 초이스 신간 등 목록(JSON). 모바일이 동일 스키마로 사용합니다.
 *
 * @history
 * - 2026-03-25: `GET` — `ALADIN_ITEMNEW_API_BASE_URL`
 */
export async function GET(request: NextRequest) {
  try {
    await getRequestUserId(request);
    const url = env.aladinItemNewApiBaseUrl;
    if (!url) {
      return NextResponse.json(
        { error: "ALADIN_ITEMNEW_API_BASE_URL is not configured" },
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
