import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";

import type {
  AladinFeedItem,
  AladinFeedResult,
} from "@/lib/aladin/bestseller-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type AladinTtbItemListViewProps = {
  feed: AladinFeedResult | null;
  loadError: string | null;
  pageTitle: string;
  pageDescription: string;
  filters?: ReactNode;
};

/**
 * 알라딘 TTB ItemList 공통 그리드(베스트셀러·초이스 신간 등).
 *
 * @history
 * - 2026-04-22: 가격 표기를 `priceStandard`(정가) 기준으로 변경
 * - 2026-04-22: 상단 필터 슬롯(`filters`) 추가
 * - 2026-04-12: 카드 클릭 시 알라딘 상품 URL(피드 `link`, 없으면 ISBN) 새 탭 열기
 * - 2026-03-25: `bestsellers/page`에서 분리, 초이스 신간 재사용
 */
export function AladinTtbItemListView({
  feed,
  loadError,
  pageTitle,
  pageDescription,
  filters,
}: AladinTtbItemListViewProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {pageDescription}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filters}
          <Button variant="outline" asChild>
            <Link href={"/dashboard" as Route}>내 서가로</Link>
          </Button>
        </div>
      </div>

      {loadError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>목록을 표시할 수 없습니다</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!loadError && feed && feed.items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>항목이 없습니다</CardTitle>
            <CardDescription>
              API 응답에 도서 항목이 없습니다. URL·파라미터를 확인해 주세요.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!loadError && feed && feed.items.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feed.items.map((item, index) => {
            const categorySegments = parseAladinCategorySegments(
              item.categoryName,
            );
            const aladinHref = resolveAladinItemHref(item);
            return (
              <li key={item.itemId || `${item.isbn13}-${item.isbn}-${index}`}>
                <AladinItemCardLink
                  href={aladinHref}
                  ariaLabel={
                    aladinHref
                      ? `${(item.title || "도서").trim()} — 알라딘에서 보기`
                      : undefined
                  }
                >
                  <Card className="h-full overflow-hidden border-border/80 transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col gap-3 p-4">
                      {categorySegments.length > 0 ? (
                        <div
                          className="flex flex-wrap items-center gap-1.5"
                          aria-label="도서 분류"
                        >
                          {categorySegments.map((seg, ci) => (
                            <Badge
                              key={`${item.itemId}-${ci}-${seg}`}
                              variant="outline"
                              className="max-w-full border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] font-normal leading-snug whitespace-normal break-words text-foreground"
                            >
                              {seg}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      <div className="flex gap-4">
                        <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                          {item.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element -- 외부 알라딘 CDN
                            <img
                              src={item.cover}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-1 text-center text-xs text-muted-foreground">
                              표지 없음
                            </div>
                          )}
                          <span
                            className="absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-xs font-bold tabular-nums shadow-sm"
                            aria-hidden
                          >
                            {index + 1}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="line-clamp-3 text-sm font-semibold leading-snug">
                            {item.title || "(제목 없음)"}
                          </p>
                          {item.author ? (
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              작가: {item.author}
                            </p>
                          ) : null}
                          {item.publisher ? (
                            <p className="text-xs text-muted-foreground">
                              출판사: {item.publisher}
                            </p>
                          ) : null}
                          {item.pubDate ? (
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              출판일: {item.pubDate}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {(item.priceStandard ?? item.priceSales) != null ? (
                              <span className="text-sm font-semibold tabular-nums text-foreground">
                                {(item.priceStandard ??
                                  item.priceSales)!.toLocaleString("ko-KR")}
                                원
                              </span>
                            ) : null}
                            {item.salesPoint != null && item.salesPoint > 0 ? (
                              <span className="text-xs text-muted-foreground">
                                판매지수{" "}
                                {item.salesPoint.toLocaleString("ko-KR")}
                              </span>
                            ) : null}
                          </div>
                          {item.isbn13 || item.isbn ? (
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {item.isbn13 || item.isbn}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AladinItemCardLink>
              </li>
            );
          })}
        </ul>
      ) : null}
    </main>
  );
}

function parseAladinCategorySegments(
  categoryName: string | undefined,
): string[] {
  if (!categoryName?.trim()) {
    return [];
  }
  return categoryName
    .split(">")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 피드 `link` 또는 ISBN으로 알라딘 상품 페이지 URL을 만듭니다.
 *
 * @history
 * - 2026-04-12: 베스트셀러·신간 카드 클릭용
 */
function resolveAladinItemHref(item: AladinFeedItem): string | null {
  const fromFeed = item.link?.trim();
  if (fromFeed) {
    return fromFeed;
  }
  const isbn = (item.isbn13 || item.isbn || "").replace(/[^0-9Xx]/g, "");
  if (!isbn) {
    return null;
  }
  return `https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${encodeURIComponent(isbn)}`;
}

function AladinItemCardLink({
  href,
  ariaLabel,
  children,
}: {
  href: string | null;
  ariaLabel?: string;
  children: ReactNode;
}) {
  if (!href) {
    return <>{children}</>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="block rounded-xl outline-none transition-opacity hover:opacity-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {children}
    </a>
  );
}
