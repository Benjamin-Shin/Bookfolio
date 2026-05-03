import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildHybridRecommendations,
  loadUserPreferenceProfileSnapshot,
} from "@/lib/recommendations/service";
import { getPersonalLibrarySummary } from "@/lib/stats/personal-library-summary";

function topEntries(
  map: Record<string, number>,
  n: number,
): { key: string; weight: number }[] {
  return Object.entries(map)
    .filter(([, v]) => Number.isFinite(v) && v > 0)
    .map(([key, weight]) => ({ key, weight }))
    .sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key, "ko"))
    .slice(0, n);
}

function formatReasonLine(code: string): string {
  const i = code.indexOf(":");
  if (i <= 0) {
    return code;
  }
  const kind = code.slice(0, i);
  const val = code.slice(i + 1);
  if (kind === "genre") {
    return `장르 가중치와 맞음 (${val})`;
  }
  if (kind === "author") {
    return `자주 읽는 저자와 유사 (${val})`;
  }
  if (kind === "format") {
    return `선호 형식과 일치 (${val})`;
  }
  return code;
}

/**
 * 맞춤 추천 — 내 종이책 서가 요약 지표 + 선호 프로필 수치 + 추천 후보 전체.
 * (서가담 전역 집계 `bookfolio-aggregate`와는 별개의 「나」 중심 화면.)
 *
 * @history
 * - 2026-05-03: 신규 — 모바일 발견·홈의 추천 설명을 웹에서 확장
 */
export default async function DiscoveryPersonalizedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  const ctx = { userId, useAdmin: true } as const;

  const [librarySummary, prefProfile, rec] = await Promise.all([
    getPersonalLibrarySummary(ctx),
    loadUserPreferenceProfileSnapshot(userId),
    buildHybridRecommendations({ userId, limit: 24 }),
  ]);

  const topGenres = topEntries(prefProfile.genreWeights, 8);
  const topAuthors = topEntries(prefProfile.authorWeights, 6);
  const topFormats = topEntries(prefProfile.formatWeights, 4);

  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 pb-16 pt-8 text-[#1b1c19] md:px-8 md:pt-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex flex-col gap-3 border-b border-[#1A3C2F]/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#675d53]">
              Discovery
            </p>
            <h1 className="font-serif text-3xl text-[#1A3C2F] md:text-4xl">맞춤 추천</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#434843]">
              아래 지표는 최근 약 {prefProfile.profileWindowDays}일간 업데이트된 내 서가 활동으로
              만든 선호 프로필입니다. 추천 점수는 콘텐츠 유사도(장르·저자·형식)와 전역 인기·신선도·품질
              피처를 합친 하이브리드(hybrid-v1)입니다.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={"/discovery" as Route}>발견 허브</Link>
          </Button>
        </div>

        <section aria-labelledby="personal-lib-heading" className="grid gap-4 lg:grid-cols-2">
          <h2 id="personal-lib-heading" className="sr-only">
            내 서가 통계
          </h2>
          <Card className="rounded-xl border-[#051b0e]/15 bg-white/80 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-[#051b0e]">
                내 서가 통계 (종이책 기준)
              </CardTitle>
              <CardDescription>
                서가담 전역 통계 페이지와 달리, 「내」 소장·완독·메모 등만 요약합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="소장 권수" value={`${librarySummary.physicalPaperCount.toLocaleString("ko-KR")}권`} />
                <Stat label="작품 수(추정)" value={`${librarySummary.ownedWorkCount.toLocaleString("ko-KR")}작품`} />
                <Stat label="완독" value={`${librarySummary.completedCount.toLocaleString("ko-KR")}권`} />
                <Stat label="읽기 전" value={`${librarySummary.unreadCount.toLocaleString("ko-KR")}권`} />
                <Stat label="읽는 중" value={`${librarySummary.readingPaperCount.toLocaleString("ko-KR")}권`} />
                <Stat
                  label="이번 달 완독 이벤트"
                  value={`${librarySummary.readCompleteThisMonthCount.toLocaleString("ko-KR")}권`}
                />
                <Stat
                  label="올해 완독 이벤트"
                  value={`${librarySummary.readCompleteThisYearCount.toLocaleString("ko-KR")}권`}
                />
                <Stat label="인생책(평점 5)" value={`${librarySummary.lifeBookCount.toLocaleString("ko-KR")}권`} />
                <Stat label="메모" value={`${librarySummary.memoCount.toLocaleString("ko-KR")}건`} />
                <Stat label="한줄평" value={`${librarySummary.oneLinerCount.toLocaleString("ko-KR")}건`} />
                <Stat
                  label="완독 쪽수 합(표시값 있는 권만)"
                  value={`${librarySummary.totalPagesRead.toLocaleString("ko-KR")}쪽`}
                />
              </div>
              {librarySummary.topAuthorsByOwnedCount.length > 0 ? (
                <div className="mt-4 rounded-lg border border-[#051b0e]/10 bg-[#fbf9f4] p-3">
                  <p className="text-xs font-medium text-[#675d53]">소장 권수 기준 상위 저자</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {librarySummary.topAuthorsByOwnedCount.map((a) => (
                      <li
                        key={a.name}
                        className="rounded-full border border-[#051b0e]/10 bg-white px-3 py-1 text-xs text-[#051b0e]"
                      >
                        {a.name}{" "}
                        <span className="tabular-nums text-[#675d53]">({a.count})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="pref-profile-heading">
          <Card className="rounded-xl border-[#051b0e]/15 bg-white/80 shadow-sm">
            <CardHeader>
              <CardTitle id="pref-profile-heading" className="font-serif text-xl text-[#051b0e]">
                추천에 쓰인 선호 프로필
              </CardTitle>
              <CardDescription>
                알고리즘 버전 {rec.algorithmVersion} · 프로필 갱신{" "}
                {prefProfile.updatedAt
                  ? new Date(prefProfile.updatedAt).toLocaleString("ko-KR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard
                  title="평균 평점(기록된 권)"
                  body={
                    prefProfile.avgRating != null
                      ? `${prefProfile.avgRating.toFixed(2)} / 5`
                      : "아직 부족"
                  }
                  hint="최근 창에서 평가한 책이 반영됩니다."
                />
                <MetricCard
                  title="완독 비율(가중)"
                  body={`${(prefProfile.completionRate * 100).toFixed(1)}%`}
                  hint="같은 기간 동안 완독한 비중에 따른 보정 계수에 사용됩니다."
                />
                <MetricCard
                  title="최근성 바이어스"
                  body={prefProfile.recencyBias.toFixed(3)}
                  hint="오래된 기록일수록 추천 가중이 약해지도록 하는 값입니다."
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <WeightList title="장르 슬러그 가중치 (상위)" rows={topGenres} empty="장르 패턴이 아직 없습니다." />
                <WeightList title="저자 가중치 (상위)" rows={topAuthors} empty="저자 패턴이 아직 없습니다." />
                <WeightList title="형식 가중치" rows={topFormats} empty="형식 패턴이 아직 없습니다." />
              </div>

              <p className="text-xs text-[#675d53]">
                최종 점수 ≈ 콘텐츠 유사도×0.6 + 인기×0.25 + 신선도×0.1 + 품질×0.05 (내부 클램프 적용).
                후보 풀은 서버에서 제한된 `books` 샘플에서 가져옵니다.
              </p>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="rec-list-heading">
          <h2 id="rec-list-heading" className="mb-4 font-serif text-xl text-[#1A3C2F]">
            추천 도서
          </h2>
          {rec.items.length === 0 ? (
            <Card className="rounded-xl border-dashed border-[#051b0e]/20 bg-white/70">
              <CardHeader>
                <CardTitle className="text-base text-[#051b0e]">표시할 추천이 없습니다</CardTitle>
                <CardDescription>
                  서가에 책을 더 쌓거나 평점·완독을 기록하면 후보가 늘어납니다.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ul className="space-y-3">
              {rec.items.map((item, idx) => (
                <li key={item.bookId}>
                  <Card className="rounded-xl border-[#051b0e]/10 bg-white/90 shadow-sm">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:gap-4">
                      <div className="flex gap-3 sm:min-w-0 sm:flex-1">
                        <div className="relative h-28 w-[4.5rem] shrink-0 overflow-hidden rounded-md bg-[#efece4]">
                          <span className="absolute left-1 top-1 rounded bg-[#1A3C2F] px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {idx + 1}
                          </span>
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
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-base font-semibold text-[#051b0e]">{item.title}</p>
                          <p className="text-sm text-[#434843]">
                            {item.authors.join(", ") || "저자 미상"} · {item.format}
                          </p>
                          {item.genreSlugs.length > 0 ? (
                            <p className="mt-1 text-xs text-[#675d53]">
                              장르: {item.genreSlugs.join(", ")}
                            </p>
                          ) : null}
                          {item.reasons.length > 0 ? (
                            <ul className="mt-2 list-inside list-disc text-xs text-[#675d53]">
                              {item.reasons.map((r) => (
                                <li key={r}>{formatReasonLine(r)}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-xs text-[#675d53]">표시할 근거 태그가 없습니다.</p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-stretch justify-between gap-2 sm:w-40">
                        <p className="text-right text-xs tabular-nums text-[#8a7f72] sm:text-left">
                          점수 {item.score.toFixed(4)}
                        </p>
                        <Button asChild className="bg-[#1a3021] text-white hover:bg-[#1a3021]/90">
                          <Link href={"/dashboard/books/new" as Route}>내 서가에 담기</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Button variant="outline" asChild>
          <Link href={"/dashboard" as Route}>내 서가로</Link>
        </Button>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#051b0e]/8 bg-[#fbf9f4] px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#675d53]">{label}</p>
      <p className="mt-0.5 font-serif text-lg tabular-nums text-[#051b0e]">{value}</p>
    </div>
  );
}

function MetricCard({ title, body, hint }: { title: string; body: string; hint: string }) {
  return (
    <div className="rounded-lg border border-[#051b0e]/10 bg-[#fbf9f4] p-3">
      <p className="text-xs font-medium text-[#675d53]">{title}</p>
      <p className="mt-1 font-serif text-xl text-[#051b0e]">{body}</p>
      <p className="mt-2 text-[11px] leading-snug text-[#8a7f72]">{hint}</p>
    </div>
  );
}

function WeightList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { key: string; weight: number }[];
  empty: string;
}) {
  return (
    <div className="rounded-lg border border-[#051b0e]/10 bg-[#fbf9f4] p-3">
      <p className="text-xs font-medium text-[#675d53]">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-[#675d53]">{empty}</p>
      ) : (
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
          {rows.map((r) => (
            <li key={r.key} className="flex justify-between gap-2 tabular-nums">
              <span className="min-w-0 truncate text-[#051b0e]">{r.key}</span>
              <span className="shrink-0 text-[#675d53]">{r.weight.toFixed(4)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
