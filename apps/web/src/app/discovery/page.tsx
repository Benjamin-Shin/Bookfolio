import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getAppProfile } from "@/lib/auth/app-profiles";
import {
  DiscoveryAladinTile,
  DiscoveryHubSection,
  DiscoveryRecTile,
} from "@/components/discovery/discovery-hub-tiles";
import {
  DISCOVERY_HUB_BOOK_LIMIT,
  loadDiscoveryHubFeeds,
} from "@/lib/discovery/discovery-hub-feeds";

export const dynamic = "force-dynamic";

/**
 * 로그인 사용자용 발견 허브 — 베스트셀러·초이스 신간·맞춤 추천을 각 최대 5권 표시.
 *
 * @history
 * - 2026-05-03: 대시보드 히어로와 동일한 호칭(`님의 서가`)·모임서가 허브와 동일한 `main` 셸
 * - 2026-05-03: 신규
 * - 2026-05-03: 바로가기 카드 대신 실제 표지·메타 + `loadDiscoveryHubFeeds` 공유
 */
export default async function DiscoveryHubPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [hubFeeds, appProfile] = await Promise.all([
    loadDiscoveryHubFeeds(session.user.id),
    getAppProfile(session.user.id),
  ]);

  const {
    categoryHint,
    bestsellerItems,
    choiceItems,
    recItems,
    aladinError,
    recError,
  } = hubFeeds;

  const displayLabel =
    appProfile?.displayName?.trim() ||
    session.user.name?.trim() ||
    session.user.email?.trim() ||
    "사용자";

  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 pb-28 pt-8 text-[#1b1c19] selection:bg-[#c5e6d4] selection:text-[#0f241c] md:px-8 md:pb-24 md:pt-10 lg:px-12">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#675d53]">
            Discovery
          </p>
          <h1 className="font-serif text-3xl text-[#1A3C2F] md:text-4xl">발견</h1>
          <p className="max-w-2xl text-sm text-[#434843]">
            베스트셀러와 초이스 신간은 프로필의 관심 카테고리(미설정 시 기본 소설)를 반영합니다.
            맞춤 추천은 {displayLabel}님의 서가에 쌓인 평점·완독·장르 패턴을 바탕으로 아직 담지 않은
            책을 골라 줍니다.
          </p>
          <p className="text-xs text-[#675d53]">{categoryHint}</p>
        </header>

        <div className="space-y-10">
          <DiscoveryHubSection
            sectionId="hub-bestseller"
            title="베스트셀러"
            description="국내도서 순위 · 아래에서 최대 5권을 미리 볼 수 있습니다. 전체 목록과 카테고리 필터는 더보기에서 열 수 있습니다."
            moreHref="/discovery/bestsellers"
            moreLabel="전체 목록"
            error={aladinError}
            emptyMessage="표시할 도서가 없습니다."
          >
            {bestsellerItems.slice(0, DISCOVERY_HUB_BOOK_LIMIT).map((item, i) => (
              <DiscoveryAladinTile key={item.itemId || `${item.isbn13}-${i}`} item={item} rank={i + 1} />
            ))}
          </DiscoveryHubSection>

          <DiscoveryHubSection
            sectionId="hub-choice"
            title="초이스 신간"
            description="알라딘 초이스 신간 피드에서 최대 5권입니다."
            moreHref="/discovery/choice-new"
            moreLabel="전체 목록"
            error={aladinError}
            emptyMessage="표시할 도서가 없습니다."
          >
            {choiceItems.slice(0, DISCOVERY_HUB_BOOK_LIMIT).map((item, i) => (
              <DiscoveryAladinTile key={item.itemId || `${item.isbn13}-c-${i}`} item={item} rank={i + 1} />
            ))}
          </DiscoveryHubSection>

          <DiscoveryHubSection
            sectionId="hub-personalized"
            title="맞춤 추천"
            description="하이브리드 추천 상위 5권입니다. 선호 프로필·서가 통계는 더보기에서 확인할 수 있습니다."
            moreHref="/discovery/personalized"
            moreLabel="지표·전체 보기"
            error={recError}
            emptyMessage="추천 후보가 없거나 아직 기록이 부족합니다."
          >
            {recItems.map((item) => (
              <DiscoveryRecTile key={item.bookId} item={item} showAddButton />
            ))}
          </DiscoveryHubSection>
        </div>

        <p>
          <Button variant="outline" asChild>
            <Link href={"/dashboard" as Route}>내 서가로 돌아가기</Link>
          </Button>
        </p>
      </div>
    </main>
  );
}
