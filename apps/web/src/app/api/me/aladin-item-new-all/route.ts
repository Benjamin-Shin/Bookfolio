import { NextRequest, NextResponse } from "next/server";

import { parseCategoryId } from "@/lib/aladin/categories";
import { getRequestUserId } from "@/lib/auth/request-user";
import { fetchAladinItemList } from "@/lib/aladin/item-list";
import { env } from "@/lib/env";

/**
 * 로그인 사용자용 알라딘 신간 전체 목록(JSON). 모바일 카테고리 탐색에서 사용합니다.
 *
 * @history
 * - 2026-04-26: 세부 카테고리 탐색은 최대 20권으로 고정
 * - 2026-04-26: `GET` — `ItemNewAll` 조합형 호출 추가 (`categoryId`, `output=js`)
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
      queryType: "ItemNewAll",
      categoryId,
      maxResults: 20
    });
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Aladin list";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
