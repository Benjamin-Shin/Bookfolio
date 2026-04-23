"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RecommendationItem = {
  bookId: string;
  title: string;
  authors: string[];
  genreSlugs: string[];
  format: string;
  coverUrl: string | null;
  score: number;
  reasons: string[];
};

type RecommendationsResponse = {
  algorithmVersion: string;
  profileUpdatedAt: string | null;
  items: RecommendationItem[];
};

function normalizePayload(raw: unknown): RecommendationsResponse {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { algorithmVersion: "unknown", profileUpdatedAt: null, items: [] };
  }
  const o = raw as Record<string, unknown>;
  const itemsRaw = Array.isArray(o.items) ? o.items : [];
  const items: RecommendationItem[] = [];
  for (const item of itemsRaw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const r = item as Record<string, unknown>;
    const bookId = typeof r.bookId === "string" ? r.bookId : "";
    const title = typeof r.title === "string" ? r.title : "";
    if (!bookId || !title) {
      continue;
    }
    items.push({
      bookId,
      title,
      authors: Array.isArray(r.authors)
        ? r.authors.filter((x): x is string => typeof x === "string")
        : [],
      genreSlugs: Array.isArray(r.genreSlugs)
        ? r.genreSlugs.filter((x): x is string => typeof x === "string")
        : [],
      format: typeof r.format === "string" ? r.format : "unknown",
      coverUrl: typeof r.coverUrl === "string" ? r.coverUrl : null,
      score: Number.isFinite(Number(r.score)) ? Number(r.score) : 0,
      reasons: Array.isArray(r.reasons)
        ? r.reasons.filter((x): x is string => typeof x === "string")
        : [],
    });
  }
  return {
    algorithmVersion:
      typeof o.algorithmVersion === "string" ? o.algorithmVersion : "unknown",
    profileUpdatedAt:
      typeof o.profileUpdatedAt === "string" ? o.profileUpdatedAt : null,
    items,
  };
}

function getRequestId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 내 서가 상단 추천 패널. 추천 API를 호출해 개인화 후보를 노출합니다.
 *
 * @history
 * - 2026-04-22: 신규 — `/api/me/recommendations` 연동 + 관심 저장 상호작용 로깅
 */
export function DashboardRecommendationPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationsResponse>({
    algorithmVersion: "unknown",
    profileUpdatedAt: null,
    items: [],
  });
  const [savedBookIds, setSavedBookIds] = useState<Set<string>>(new Set());
  const requestId = useMemo(() => getRequestId(), []);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/me/recommendations?limit=2&trackImpression=1&requestId=${encodeURIComponent(requestId)}&bucket=dashboard_shelf`;
      const res = await fetch(url, { credentials: "include" });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          json &&
          typeof json === "object" &&
          "error" in json &&
          typeof (json as { error: unknown }).error === "string"
            ? (json as { error: string }).error
            : "추천 목록을 불러오지 못했습니다.";
        setError(msg);
        setData({
          algorithmVersion: "unknown",
          profileUpdatedAt: null,
          items: [],
        });
        return;
      }
      setData(normalizePayload(json));
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setData({
        algorithmVersion: "unknown",
        profileUpdatedAt: null,
        items: [],
      });
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  const handleSaveInterest = useCallback(
    async (item: RecommendationItem) => {
      try {
        const res = await fetch("/api/me/recommendations/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            bookId: item.bookId,
            interactionType: "save",
            surface: "dashboard_shelf_panel",
            requestId,
            metadata: {
              source: "dashboard_recommendation_panel",
              title: item.title,
            },
          }),
        });
        if (!res.ok) {
          return;
        }
        setSavedBookIds((prev) => {
          const next = new Set(prev);
          next.add(item.bookId);
          return next;
        });
      } catch {
        // no-op
      }
    },
    [requestId],
  );

  return (
    <Card className="border-[#051b0e]/15 bg-white/70">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-serif text-xl text-[#051b0e]">
            내 취향 추천
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadRecommendations()}
            disabled={loading}
          >
            {loading ? "새로고침 중…" : "새로고침"}
          </Button>
        </div>
        <CardDescription>
          최근 평점·독서 상태·장르 선호를 기반으로 아직 내 서재에 없는 책을
          추천합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!error && loading ? (
          <p className="text-sm text-[#434843]">추천 목록을 불러오는 중…</p>
        ) : null}
        {!error && !loading && data.items.length === 0 ? (
          <p className="text-sm text-[#434843]">
            추천할 책이 아직 없습니다. 도서 평점/완독 기록이 쌓이면 더 정확한
            추천이 나옵니다.
          </p>
        ) : null}

        {!error && data.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {data.items.map((item) => (
              <article
                key={item.bookId}
                className="rounded-lg border border-[#051b0e]/10 bg-[#fbf9f4] p-3"
              >
                <div className="flex gap-3">
                  <div className="h-24 w-16 shrink-0 overflow-hidden rounded bg-[#efece4]">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-[#6e6a60]">
                        표지 없음
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 font-serif text-sm text-[#051b0e]">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-[#434843]">
                      {item.authors.join(", ") || "저자 미상"}
                    </p>
                    {item.reasons.length > 0 ? (
                      <p className="mt-2 line-clamp-2 text-[11px] text-[#675d53]">
                        추천 근거: {item.reasons.join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-[#675d53]">
                    점수 {item.score.toFixed(2)}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleSaveInterest(item)}
                      disabled={savedBookIds.has(item.bookId)}
                    >
                      {savedBookIds.has(item.bookId)
                        ? "관심 저장됨"
                        : "관심 저장"}
                    </Button>
                    <Button
                      asChild
                      type="button"
                      size="sm"
                      className="bg-[#1a3021] text-white hover:bg-[#1a3021]/90"
                    >
                      <Link href="/dashboard/books/new">내 서가에 추가</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
