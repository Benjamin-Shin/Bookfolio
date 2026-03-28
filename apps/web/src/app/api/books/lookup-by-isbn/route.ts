import { NextRequest, NextResponse } from "next/server";

import {
  lookupBookByIsbn,
  normalizeIsbn,
  type IsbnLookupExternalProvider
} from "@/lib/books/lookup";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { findCanonicalBookByIsbn, mapCanonicalBookToLookupResult } from "@/lib/books/repository";

const ISBN_LOOKUP_PROVIDERS: readonly IsbnLookupExternalProvider[] = ["naver", "nl"];

function parseLookupProvider(raw: unknown): IsbnLookupExternalProvider | undefined {
  if (raw === undefined || raw === null || raw === "") {
    return undefined;
  }
  if (typeof raw !== "string") {
    return undefined;
  }
  return ISBN_LOOKUP_PROVIDERS.includes(raw as IsbnLookupExternalProvider)
    ? (raw as IsbnLookupExternalProvider)
    : undefined;
}

/**
 * ISBN 메타 조회. 로컬 `books`가 있으면 우선 반환. `provider`가 있으면 해당 외부 API만 호출합니다.
 *
 * @history
 * - 2026-03-28: `google` 제공자 제거(Google Books API 미사용).
 * - 2026-03-24: 본문 `provider`(naver | nl) 선택 지원 — 관리자 폼에서 출처별 검색 분리
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { isbn?: string; provider?: unknown };
    const { isbn } = body;
    if (!isbn) {
      return NextResponse.json({ error: "ISBN is required" }, { status: 400 });
    }

    const normalized = normalizeIsbn(isbn);
    if (!normalized) {
      return NextResponse.json({ error: "ISBN is required" }, { status: 400 });
    }

    const provider = parseLookupProvider(body.provider);
    if (body.provider != null && body.provider !== "" && provider === undefined) {
      return NextResponse.json(
        { error: "provider는 naver, nl 중 하나이거나 생략해야 합니다." },
        { status: 400 }
      );
    }

    if (!provider) {
      const supabase = createSupabaseAdminClient();
      const local = await findCanonicalBookByIsbn(supabase, normalized);
      const fromCatalog = local ? mapCanonicalBookToLookupResult(local) : null;
      if (fromCatalog) {
        return NextResponse.json(fromCatalog);
      }
    }

    const result = await lookupBookByIsbn(isbn, provider ? { provider } : undefined);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
