import type { Route } from "next";
import Link from "next/link";
import { Children, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { AladinFeedItem } from "@/lib/aladin/bestseller-feed";
import { resolveAladinItemHref } from "@/lib/aladin/resolve-item-href";
import type { DiscoveryHubRecItem } from "@/lib/discovery/discovery-hub-feeds";
import { discoveryDetailHrefFromAladinItem } from "@/lib/discovery/catalog-detail-href";

/**
 * 발견 허브·대시보드 레일 — 섹션 헤더 + 최대 5권 그리드.
 *
 * @history
 * - 2026-05-04: 타일 메인 클릭 → `/discovery/books/by-isbn/...`; 보조 `알라딘에서 보기` 링크
 * - 2026-05-03: `discovery/page`·`DashboardDiscoveryRails` 공용 타일 UI
 */
export function DiscoveryHubSection({
  sectionId,
  title,
  description,
  moreHref,
  moreLabel,
  error,
  emptyMessage,
  children,
}: {
  sectionId: string;
  title: string;
  description: string;
  moreHref: Route;
  moreLabel: string;
  error: string | null;
  emptyMessage: string;
  children: ReactNode;
}) {
  const hasTiles = Children.count(children) > 0;
  return (
    <section
      className="rounded-xl border border-[#051b0e]/10 bg-white/75 p-4 shadow-sm md:p-6"
      aria-labelledby={sectionId}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-[#1A3C2F]/10 pb-3">
        <div>
          <h2 id={sectionId} className="font-serif text-xl text-[#1A3C2F] md:text-2xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[#675d53]">{description}</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 border-[#1A3C2F]/25 text-[#163826]" asChild>
          <Link href={moreHref}>{moreLabel}</Link>
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : hasTiles ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">{children}</ul>
      ) : (
        <p className="text-sm text-[#675d53]">{emptyMessage}</p>
      )}
    </section>
  );
}

/**
 * 알라딘 허브/레일 카드 클릭 → ISBN 있으면 캐논 상세, 없으면 알라딘 외부 링크.
 *
 * @history
 * - 2026-05-04: `/discovery/books/by-isbn/...` + 보조 「알라딘에서 보기」
 */
export function DiscoveryAladinTile({ item, rank }: { item: AladinFeedItem; rank: number }) {
  const detailHref = discoveryDetailHrefFromAladinItem(item);
  const aladinHref = resolveAladinItemHref(item);
  const inner = (
    <div className="flex flex-col">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-[#efece4] shadow-sm">
        {item.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- 알라딘 CDN
          <img
            src={item.cover}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-[#6e6a60]">
            표지 없음
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 flex h-7 min-w-7 items-center justify-center rounded-full bg-white/95 px-1.5 text-[11px] font-bold tabular-nums text-[#1A3C2F] shadow-sm">
          {rank}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 font-serif text-sm font-semibold leading-snug text-[#051b0e]">
        {item.title || "(제목 없음)"}
      </p>
      {item.author ? (
        <p className="line-clamp-2 text-xs text-[#675d53]">{item.author}</p>
      ) : null}
    </div>
  );

  if (detailHref) {
    return (
      <li className="flex flex-col gap-2">
        <Link
          href={detailHref as Route}
          className="block rounded-lg outline-none ring-offset-2 transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#1A3C2F]/30"
        >
          {inner}
        </Link>
        {aladinHref ? (
          <a
            href={aladinHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-[11px] font-medium text-[#1A3C2F]/80 underline-offset-4 hover:underline"
          >
            알라딘에서 보기
          </a>
        ) : null}
      </li>
    );
  }

  if (aladinHref) {
    return (
      <li>
        <a
          href={aladinHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg outline-none ring-offset-2 transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#1A3C2F]/30"
        >
          {inner}
        </a>
      </li>
    );
  }
  return <li>{inner}</li>;
}

/**
 * 추천(`books.id`) 카드 — 본문 클릭 시 발견 캐논 상세(`/discovery/books/:bookId`).
 *
 * @history
 * - 2026-05-04: 타일 메인 영역 `Link`/발견 상세 진입
 */
export function DiscoveryRecTile({
  item,
  showAddButton = true,
}: {
  item: DiscoveryHubRecItem;
  /** 대시보드 레일 등 좁은 영역에서는 false. */
  showAddButton?: boolean;
}) {
  return (
    <li className="flex flex-col rounded-lg border border-[#051b0e]/10 bg-[#fbf9f4] p-2 shadow-sm">
      <Link
        href={`/discovery/books/${item.bookId}` as Route}
        className="block rounded-md outline-none ring-offset-2 transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#1A3C2F]/30"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-[#efece4]">
          {item.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
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
        <p className="mt-2 line-clamp-2 font-serif text-xs font-semibold leading-snug text-[#051b0e]">
          {item.title}
        </p>
        <p className="line-clamp-2 text-[11px] text-[#675d53]">
          {item.authors.join(", ") || "저자 미상"}
        </p>
        {item.reasons.length > 0 ? (
          <p className="mt-1 line-clamp-2 text-[11px] text-[#675d53]">
            {item.reasons.map(formatReasonChip).join(" · ")}
          </p>
        ) : null}
      </Link>
      <div className="mt-auto flex flex-col gap-2 pt-2">
        <p className="text-[11px] tabular-nums text-[#8a7f72]">점수 {item.score.toFixed(2)}</p>
        {showAddButton ? (
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="h-8 w-full text-xs text-[#051b0e]"
          >
            <Link href={"/dashboard/books/new" as Route}>내 서가에 담기</Link>
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function formatReasonChip(code: string): string {
  const idx = code.indexOf(":");
  if (idx <= 0) {
    return code;
  }
  const kind = code.slice(0, idx);
  const val = code.slice(idx + 1);
  if (kind === "genre") {
    return `장르 ${val}`;
  }
  if (kind === "author") {
    return `저자 ${val}`;
  }
  if (kind === "format") {
    return `형식 ${val}`;
  }
  return code;
}
