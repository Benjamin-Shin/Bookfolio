import { BookMarked, Star, Library } from "lucide-react";

import { DashboardProfileOpenButton } from "@/components/dashboard/dashboard-profile-open-button.client";
import { normalizeCoverUrlForClient } from "@/lib/books/cover-url";

export interface DashboardHomeHeroProps {
  displayLabel: string;
  avatarUrl: string | null;
  /** 소장 총 권수 */
  totalBooks: number;
  /** 이번 UTC 달에 완독 처리된 것으로 보이는 권수(`updatedAt` 기준 근사) */
  booksFinishedThisMonth: number;
  /** 평점이 있는 완독 권만으로 계산한 평균, 없으면 null */
  averageRating: number | null;
  /** `app_profiles.annual_reading_goal` 등 보조 카피 */
  tagline: string;
}

/**
 * 내 서가 상단 프로필·요약 통계·명언 카드(시안 상단 와이드 카드).
 *
 * @history
 * - 2026-05-03: 통계 라벨 한 줄 유지(이번 달 읽은 책)·통계 행 아이콘·간격 소폭 압축
 * - 2026-05-03: 히어로 좌측 프로필 블록(아바타·타이틀·태그라인) 간격·타이포 소폭 축소
 * - 2026-05-03: 신규
 */
export function DashboardHomeHero({
  displayLabel,
  avatarUrl,
  totalBooks,
  booksFinishedThisMonth,
  averageRating,
  tagline,
}: DashboardHomeHeroProps) {
  const src = normalizeCoverUrlForClient(avatarUrl);
  const avgText =
    averageRating != null ? `${averageRating.toFixed(1)} / 5` : "—";

  return (
    <section
      className="mb-8 rounded-2xl border border-[#1A3C2F]/8 bg-white p-6 shadow-[0_8px_30px_rgba(26,60,47,0.06)] md:p-8"
      aria-labelledby="dash-home-hero-heading"
    >
      <h2 id="dash-home-hero-heading" className="sr-only">
        내 서가 요약
      </h2>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:col-span-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-[#1A3C2F]/12 bg-[#F8F9FA] shadow-inner">
            {src ? (
              <img
                src={src}
                alt=""
                className="size-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="flex size-full items-center justify-center font-serif text-lg font-semibold text-[#1A3C2F]/40"
                aria-hidden
              >
                {displayLabel.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate font-serif text-lg font-semibold tracking-tight text-[#1A3C2F] md:text-xl">
              {displayLabel}님의 서가
            </p>
            <p className="line-clamp-2 text-sm leading-snug text-[#5c6560]">
              {tagline}
            </p>
            <DashboardProfileOpenButton />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-[#1A3C2F]/8 pt-6 sm:grid-cols-3 sm:border-t-0 sm:pt-0 lg:col-span-5 lg:border-s lg:border-t-0 lg:ps-8">
          <div className="flex items-start gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1A3C2F]/[0.08] text-[#1A3C2F]">
              <Library className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-normal text-[#5c6560]">
                총 권수
              </p>
              <p className="mt-0.5 font-serif text-2xl font-semibold text-[#1A3C2F]">
                {totalBooks.toLocaleString("ko-KR")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1A3C2F]/[0.08] text-[#1A3C2F]">
              <BookMarked className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="whitespace-nowrap text-xs font-medium uppercase tracking-normal text-[#5c6560]">
                이번 달 읽은 책
              </p>
              <p className="mt-0.5 font-serif text-2xl font-semibold text-[#1A3C2F]">
                {booksFinishedThisMonth.toLocaleString("ko-KR")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1A3C2F]/[0.08] text-[#1A3C2F]">
              <Star className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-normal text-[#5c6560]">
                평균 평점
              </p>
              <p className="mt-0.5 font-serif text-2xl font-semibold text-[#1A3C2F]">
                {avgText}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-[#F0F2F4] p-5 lg:col-span-3">
          <p className="font-serif text-sm italic leading-relaxed text-[#3d4a42] md:text-base">
            &ldquo;책은 삶의 조용한 대화다.&rdquo;
          </p>
          <p className="mt-2 text-right text-xs font-medium text-[#5c6560]">
            — 서가담
          </p>
        </div>
      </div>
    </section>
  );
}
