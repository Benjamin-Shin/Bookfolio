import type { Route } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { readingProgressPercent } from "@/components/dashboard/dashboard-editorial-book-grid";
import { Button } from "@/components/ui/button";
import { normalizeCoverUrlForClient } from "@/lib/books/cover-url";

import type { UserBookSummary } from "@bookfolio/shared";

function readingProgress(book: UserBookSummary): {
  pct: number;
  label: string;
} {
  const total = book.readingTotalPages ?? book.pageCount ?? null;
  const cur = book.currentPage ?? null;
  const pctKnown = readingProgressPercent(book);
  const pct = pctKnown ?? 0;
  if (total != null && total > 0 && cur != null && cur >= 0) {
    return {
      pct,
      label: `${cur.toLocaleString("ko-KR")} / ${total.toLocaleString("ko-KR")} 페이지`,
    };
  }
  if (total != null && total > 0) {
    return { pct: 0, label: `0 / ${total.toLocaleString("ko-KR")} 페이지` };
  }
  return { pct: 0, label: "진행률을 입력해 보세요" };
}

function authorsPublisherLine(book: UserBookSummary): string {
  const a = book.authors?.length ? book.authors.join(", ") : "저자 미상";
  return a;
}

export interface DashboardCurrentReadingFeaturedProps {
  book: UserBookSummary | null;
}

/**
 * 시안 좌측「현재 읽는 책」대형 카드(표지·진행률·이어 읽기).
 *
 * @history
 * - 2026-05-03: 신규
 */
export function DashboardCurrentReadingFeatured({
  book,
}: DashboardCurrentReadingFeaturedProps) {
  return (
    <section
      className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-[#1A3C2F]/8 bg-white shadow-[0_8px_30px_rgba(26,60,47,0.06)]"
      aria-labelledby="dash-current-reading-title"
    >
      <div className="flex items-center gap-2 border-b border-[#1A3C2F]/8 px-5 py-4">
        <BookOpen className="size-5 text-[#1A3C2F]" aria-hidden />
        <h2
          id="dash-current-reading-title"
          className="font-serif text-lg font-semibold text-[#1A3C2F]"
        >
          현재 읽는 책
        </h2>
      </div>

      {!book ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center text-sm text-[#5c6560]">
          <p>읽는 중인 책이 없습니다.</p>
          <p className="text-xs">전체 탭에서 책을 등록하거나 상태를 바꿔 보세요.</p>
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col">
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#1f352c] via-[#15261f] to-[#0d1814]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_40%)] opacity-90 mix-blend-overlay"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 to-black/45"
            aria-hidden
          />
          <div className="relative z-[1] flex flex-1 flex-col gap-5 p-5 md:flex-row md:items-stretch md:gap-6 md:p-6">
            <div className="relative mx-auto w-[7.5rem] shrink-0 overflow-hidden rounded-md shadow-lg md:mx-0 md:w-[8.5rem]">
              {normalizeCoverUrlForClient(book.coverUrl) ? (
                <img
                  src={normalizeCoverUrlForClient(book.coverUrl)!}
                  alt=""
                  className="aspect-[2/3] w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex aspect-[2/3] w-full items-center justify-center bg-[#2a3d34] px-2 text-center font-serif text-xs text-white/80">
                  표지 없음
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 text-white">
              <div>
                <p className="font-serif text-xl font-semibold leading-snug md:text-2xl">
                  {book.title}
                </p>
                <p className="mt-2 text-sm text-white/75">
                  {authorsPublisherLine(book)}
                </p>
              </div>
              <div className="space-y-2">
                {(() => {
                  const { pct, label } = readingProgress(book);
                  return (
                    <>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-medium text-[#a8e3c5]">
                          {pct}%
                        </span>
                        <span className="text-xs text-white/70">{label}</span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-white/15"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        {/* 동적 % 폭 — Tailwind만으로는 분모별 값 표현이 어려움 */}
                        <div
                          className="h-full rounded-full bg-[#5cb88a]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  asChild
                  className="rounded-full bg-[#1A3C2F] px-5 text-white hover:bg-[#1A3C2F]/90"
                >
                  <Link href={`/dashboard/books/${book.id}` as Route}>
                    이어서 읽기
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
