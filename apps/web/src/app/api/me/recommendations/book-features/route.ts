import { NextRequest, NextResponse } from "next/server";

import { getAppUserRole } from "@/lib/auth/get-app-user-role";
import { getRequestUserId } from "@/lib/auth/request-user";
import { upsertBookFeatureVectors } from "@/lib/recommendations/service";

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

/**
 * 도서 피처 벡터를 배치 반영합니다 (관리자/스태프 전용).
 *
 * @history
 * - 2026-04-22: 신규 — 추천 2차 book_feature_vectors 적재 엔드포인트
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const role = await getAppUserRole(userId);
    if (role !== "ADMIN" && role !== "STAFF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const rowsRaw = Array.isArray(body.items) ? body.items : [];
    const rows = rowsRaw
      .map((item) => {
        const row = item as Record<string, unknown>;
        const bookId = typeof row.bookId === "string" ? row.bookId.trim() : "";
        if (!isUuid(bookId)) {
          return null;
        }
        const embedding = Array.isArray(row.embedding)
          ? row.embedding
              .map((x) => Number(x))
              .filter((x) => Number.isFinite(x))
              .map((x) => Number(x))
          : null;
        return {
          bookId,
          embedding,
          embeddingModelVersion:
            typeof row.embeddingModelVersion === "string" ? row.embeddingModelVersion : null,
          contentQualityScore: Number.isFinite(Number(row.contentQualityScore))
            ? Number(row.contentQualityScore)
            : null,
          freshnessScore: Number.isFinite(Number(row.freshnessScore)) ? Number(row.freshnessScore) : null,
          globalPopularityScore: Number.isFinite(Number(row.globalPopularityScore))
            ? Number(row.globalPopularityScore)
            : null,
          featureSummary:
            row.featureSummary && typeof row.featureSummary === "object" && !Array.isArray(row.featureSummary)
              ? (row.featureSummary as Record<string, unknown>)
              : {}
        };
      })
      .filter(
        (
          x
        ): x is {
          bookId: string;
          embedding: number[] | null;
          embeddingModelVersion: string | null;
          contentQualityScore: number | null;
          freshnessScore: number | null;
          globalPopularityScore: number | null;
          featureSummary: Record<string, unknown>;
        } => x !== null
      );

    if (rows.length === 0) {
      return NextResponse.json({ error: "반영할 items가 없습니다." }, { status: 400 });
    }

    const count = await upsertBookFeatureVectors(rows);
    return NextResponse.json({ status: "ok", count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upsert book features";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
