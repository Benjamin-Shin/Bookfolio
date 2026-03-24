import { NextRequest, NextResponse } from "next/server";

import type { BookLookupResult } from "@bookfolio/shared";

import { dedupeLookupByIsbn, searchBooksByTitleFromExternalApis } from "@/lib/books/lookup";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { searchCanonicalBooksByTitle } from "@/lib/books/repository";

/**
 * 제목·키워드로 메타 검색. `{ results: BookLookupResult[] }` — `books` → 네이버 → 국립중앙도서관 순, ISBN 중복은 앞선 출처 우선.
 *
 * @history
 * - 2026-03-24: 카탈로그·외부 API 우선순위 반영 (네이버 → 국립중앙도서관; Google 제목 검색 제거)
 * - 2026-03-24: 모바일 책 등록용 제목 검색 API 추가
 */
export async function POST(request: NextRequest) {
  try {
    const { query } = (await request.json()) as { query?: string };
    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const fromCatalog = await searchCanonicalBooksByTitle(supabase, query);

    let fromApis: BookLookupResult[] = [];
    try {
      fromApis = await searchBooksByTitleFromExternalApis(query);
    } catch (apiErr) {
      if (fromCatalog.length === 0) {
        throw apiErr;
      }
    }

    const results = dedupeLookupByIsbn([...fromCatalog, ...fromApis]);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
