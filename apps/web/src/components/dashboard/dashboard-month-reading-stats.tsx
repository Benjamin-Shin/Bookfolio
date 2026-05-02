import type { Route } from "next";
import Link from "next/link";
import { BarChart3, ChevronRight } from "lucide-react";

export interface DashboardMonthReadingStatsProps {
  weekBars: number[];
  booksReadThisMonth: number;
  avgRatingDisplay: string;
}

/**
 * 우측「독서 통계」카드 — 이번 달 주차별 활동(캘린더 RPC 합계)과 요약 수치.
 *
 * @history
 * - 2026-05-03: 신규
 */
export function DashboardMonthReadingStats({
  weekBars,
  booksReadThisMonth,
  avgRatingDisplay,
}: DashboardMonthReadingStatsProps) {
  const max = Math.max(1, ...weekBars, 1);
  const labels = ["1주", "2주", "3주", "4주"];

  return (
    <section
      className="flex h-full min-h-[280px] flex-col rounded-2xl border border-[#1A3C2F]/8 bg-white shadow-[0_8px_30px_rgba(26,60,47,0.06)]"
      aria-labelledby="dash-month-stats-title"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#1A3C2F]/8 px-5 py-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-[#1A3C2F]" aria-hidden />
          <h2
            id="dash-month-stats-title"
            className="font-serif text-lg font-semibold text-[#1A3C2F]"
          >
            독서 통계
          </h2>
        </div>
        <span className="rounded-full border border-[#1A3C2F]/15 bg-[#F8F9FA] px-3 py-1 text-xs font-medium text-[#1A3C2F]">
          이번 달
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-5 md:flex-row md:items-stretch md:gap-8 md:p-6">
        <div className="flex min-h-[11rem] flex-1 items-end justify-between gap-2 md:gap-3">
          {weekBars.map((count, i) => {
            const pct = Math.max(6, Math.round((count / max) * 100));
            return (
              <div
                key={labels[i]}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex h-36 w-full items-end justify-center">
                  <div
                    className="w-[42%] max-w-[3rem] rounded-t-md bg-[#1A3C2F] shadow-sm transition-[height] duration-300"
                    style={{ height: `${pct}%` }}
                    title={`${labels[i]}: ${count}건`}
                  />
                </div>
                <span className="text-xs font-medium text-[#5c6560]">
                  {labels[i]}
                </span>
              </div>
            );
          })}
        </div>

        <ul className="shrink-0 space-y-3 rounded-xl bg-[#F8F9FA] p-4 text-sm text-[#3d4a42] md:w-52">
          <li>
            <span className="text-[#5c6560]">읽은 책</span>{" "}
            <span className="font-semibold text-[#1A3C2F]">
              {booksReadThisMonth.toLocaleString("ko-KR")}권
            </span>
          </li>
          <li>
            <span className="text-[#5c6560]">평균 평점</span>{" "}
            <span className="font-semibold text-[#1A3C2F]">
              {avgRatingDisplay}
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-auto flex justify-end border-t border-[#1A3C2F]/8 px-5 py-3">
        <Link
          href={"/dashboard/bookfolio-aggregate" as Route}
          className="inline-flex items-center gap-0.5 text-sm font-medium text-[#1A3C2F] hover:underline"
        >
          통계 더보기
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
