import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { recordRecommendationImpressions } from "@/lib/recommendations/service";

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

/**
 * 추천 노출 배치를 기록합니다.
 *
 * @history
 * - 2026-04-22: 신규 — 추천 1차 impression 수집 API
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const body = (await request.json()) as Record<string, unknown>;
    const algorithmVersion =
      typeof body.algorithmVersion === "string" && body.algorithmVersion.trim()
        ? body.algorithmVersion.trim()
        : "hybrid-v1";
    const experimentBucket =
      typeof body.experimentBucket === "string" && body.experimentBucket.trim()
        ? body.experimentBucket.trim()
        : "default";
    const requestId = typeof body.requestId === "string" ? body.requestId : null;
    const itemsRaw = Array.isArray(body.items) ? body.items : [];
    const items = itemsRaw
      .map((item, idx) => {
        const row = item as Record<string, unknown>;
        const bookId = typeof row.bookId === "string" ? row.bookId.trim() : "";
        const rankRaw = Number(row.rank);
        const rank = Number.isFinite(rankRaw) ? Math.max(1, Math.floor(rankRaw)) : idx + 1;
        const scoreRaw = Number(row.score);
        const reasonCodes = Array.isArray(row.reasonCodes)
          ? row.reasonCodes.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
          : [];
        if (!isUuid(bookId)) {
          return null;
        }
        return {
          bookId,
          rank,
          score: Number.isFinite(scoreRaw) ? scoreRaw : null,
          reasonCodes
        };
      })
      .filter((item): item is { bookId: string; rank: number; score: number | null; reasonCodes: string[] } => item !== null);

    if (items.length === 0) {
      return NextResponse.json({ error: "기록할 items가 없습니다." }, { status: 400 });
    }

    await recordRecommendationImpressions({
      userId,
      algorithmVersion,
      experimentBucket,
      requestId,
      items
    });

    return NextResponse.json({ status: "ok", count: items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record impressions";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
