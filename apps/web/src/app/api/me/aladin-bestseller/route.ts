import { NextRequest, NextResponse } from "next/server";

import { parseCategoryId } from "@/lib/aladin/categories";
import { getRequestUserId } from "@/lib/auth/request-user";
import { fetchAladinItemList } from "@/lib/aladin/item-list";
import { env } from "@/lib/env";

/**
 * 로그인 사용자용 알라딘 목록(JSON). 모바일 앱이 동일 데이터를 씁니다.
 *
 * @history
 * - 2026-04-22: `categoryId` 쿼리 파라미터 추가, `ALADIN_API_BASE_URL` 조합형 호출
 * - 2026-03-25: `GET` — 베스트셀러 프록시·XML/JSON 파싱
 */
export async function GET(request: NextRequest) {
  try {
    await getRequestUserId(request);
    const url = env.aladinApiBaseUrl;
    const categoryId = parseCategoryId(request.nextUrl.searchParams.get("categoryId"));
    if (!url) {
      return NextResponse.json(
        { error: "ALADIN_API_BASE_URL is not configured" },
        { status: 503 }
      );
    }
    const data = await fetchAladinItemList(url, {
      queryType: "Bestseller",
      categoryId
    });
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Aladin list";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
