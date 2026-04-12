"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PurchasePayload = {
  bookId: string;
  aladin: { url: string; priceKrw: number | null };
  naver: { url: string | null; priceKrw: number | null };
  kyobo: { url: string };
  cached: boolean;
  fetchedAt: string;
};

type OneLiner = {
  userId: string;
  displayName: string | null;
  body: string;
  updatedAt: string;
};

/**
 * 비소장(`isOwned === false`)일 때 캐논 도서 구매 링크·커뮤니티 한줄평.
 *
 * @history
 * - 2026-04-08: `GET /api/me/canon-books/:bookId/*` 클라이언트 조회
 */
export function CanonPurchaseLinksCard({ bookId }: { bookId: string }) {
  const [offers, setOffers] = useState<PurchasePayload | null>(null);
  const [liners, setLiners] = useState<OneLiner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [oRes, lRes] = await Promise.all([
        fetch(`/api/me/canon-books/${encodeURIComponent(bookId)}/purchase-offers`, { credentials: "include" }),
        fetch(`/api/me/canon-books/${encodeURIComponent(bookId)}/community-one-liners?limit=30`, {
          credentials: "include"
        })
      ]);
      if (!oRes.ok) {
        const j = (await oRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `구매 정보를 불러오지 못했습니다. (${oRes.status})`);
      }
      if (!lRes.ok) {
        const j = (await lRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `한줄평을 불러오지 못했습니다. (${lRes.status})`);
      }
      const oJson = (await oRes.json()) as PurchasePayload;
      const lJson = (await lRes.json()) as { items: OneLiner[] };
      setOffers(oJson);
      setLiners(lJson.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
      setOffers(null);
      setLiners([]);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    void load();
  }, [load]);

  const priceLine = (krw: number | null) =>
    krw != null && krw > 0 ? `${krw.toLocaleString("ko-KR")}원` : "가격 정보 없음";

  return (
    <div className="space-y-6">
      <Card className="border-border/80">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg">구매·가격 (외부)</CardTitle>
              <CardDescription>
                알라딘·네이버·교보문고로 이동합니다. 가격은 참고용이며 각 사이트에서 확인해 주세요.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">불러오는 중…</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!loading && offers ? (
            <>
              <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">알라딘</p>
                  <p className="text-xs text-muted-foreground">{priceLine(offers.aladin.priceKrw)}</p>
                </div>
                <Button variant="secondary" size="sm" asChild>
                  <a href={offers.aladin.url} target="_blank" rel="noopener noreferrer">
                    알라딘에서 보기
                  </a>
                </Button>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">네이버 책</p>
                  <p className="text-xs text-muted-foreground">
                    {offers.naver.url ? priceLine(offers.naver.priceKrw) : "링크 없음"}
                  </p>
                </div>
                {offers.naver.url ? (
                  <Button variant="secondary" size="sm" asChild>
                    <a href={offers.naver.url} target="_blank" rel="noopener noreferrer">
                      네이버에서 보기
                    </a>
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" disabled>
                    링크 없음
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">교보문고 검색</p>
                  <p className="text-xs text-muted-foreground">통합 검색 결과</p>
                </div>
                <Button variant="secondary" size="sm" asChild>
                  <a href={offers.kyobo.url} target="_blank" rel="noopener noreferrer">
                    교보에서 검색
                  </a>
                </Button>
              </div>
              {offers.cached ? (
                <p className="text-xs text-muted-foreground">캐시된 정보입니다. 갱신 시각: {offers.fetchedAt}</p>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-lg">회원 한줄평</CardTitle>
          <CardDescription>같은 도서에 남긴 공개 한줄평입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {liners.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 한줄평이 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {liners.map((row) => (
                <li key={`${row.userId}-${row.updatedAt}`} className="rounded-md border border-border/60 bg-card/60 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {row.displayName?.trim() ? row.displayName : "회원"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{row.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
