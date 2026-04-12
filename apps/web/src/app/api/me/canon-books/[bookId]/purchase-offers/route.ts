import { NextRequest, NextResponse } from "next/server";

import { getOrRefreshBookPurchaseOffers } from "@/lib/books/purchase-offers";
import { getRequestUserId } from "@/lib/auth/request-user";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * 캐논 도서(`books.id`) 구매 링크·가격 힌트(회원 전용, 캐시 테이블).
 *
 * @history
 * - 2026-04-08: `GET` — `book_purchase_offer_cache`
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bookId: string }> }
) {
  try {
    await getRequestUserId(request);
    const { bookId } = await context.params;
    if (!bookId?.trim()) {
      return NextResponse.json({ error: "bookId가 필요합니다." }, { status: 400 });
    }
    const admin = createSupabaseAdminClient();
    const payload = await getOrRefreshBookPurchaseOffers(admin, bookId.trim());
    if (!payload) {
      return NextResponse.json({ error: "도서를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load purchase offers";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
