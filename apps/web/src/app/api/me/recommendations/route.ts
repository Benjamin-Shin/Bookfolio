import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import {
  buildHybridRecommendations,
  rebuildUserPreferenceProfile,
  recordRecommendationImpressions
} from "@/lib/recommendations/service";

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

/**
 * 개인화 추천 목록을 반환합니다.
 *
 * @history
 * - 2026-04-22: 신규 — 추천 1·2차 API (조회 + 선택 노출 로깅)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 50) : 20;
    const withImpression = searchParams.get("trackImpression") === "1";
    const requestId = searchParams.get("requestId")?.trim() || null;
    const experimentBucket = searchParams.get("bucket")?.trim() || "default";

    const result = await buildHybridRecommendations({ userId, limit });

    if (withImpression) {
      await recordRecommendationImpressions({
        userId,
        algorithmVersion: result.algorithmVersion,
        experimentBucket,
        requestId,
        items: result.items.map((item, idx) => ({
          bookId: item.bookId,
          rank: idx + 1,
          score: item.score,
          reasonCodes: item.reasons
        }))
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load recommendations";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

/**
 * 사용자 선호 프로필을 수동 재계산합니다.
 *
 * @history
 * - 2026-04-22: 신규 — 추천 2차 프로필 재생성 API
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const targetUserId = typeof body.userId === "string" ? body.userId.trim() : userId;
    if (!isUuid(targetUserId)) {
      return NextResponse.json({ error: "유효하지 않은 userId입니다." }, { status: 400 });
    }
    if (targetUserId !== userId) {
      return NextResponse.json({ error: "본인 프로필만 재계산할 수 있습니다." }, { status: 403 });
    }

    const profile = await rebuildUserPreferenceProfile(userId);
    return NextResponse.json({ status: "ok", profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rebuild preference profile";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
