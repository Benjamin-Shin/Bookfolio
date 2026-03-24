import { NextRequest, NextResponse } from "next/server";

import { searchBooksByTitle } from "@/lib/books/lookup";

/**
 * 제목·키워드로 외부 메타데이터 검색. `{ results: BookLookupResult[] }` 형태로 반환합니다.
 *
 * @history
 * - 2026-03-24: 모바일 책 등록용 제목 검색 API 추가
 */
export async function POST(request: NextRequest) {
  try {
    const { query } = (await request.json()) as { query?: string };
    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const results = await searchBooksByTitle(query);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
