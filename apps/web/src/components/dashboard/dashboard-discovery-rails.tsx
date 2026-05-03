import type { Route } from "next";
import Link from "next/link";

import {
  DiscoveryAladinTile,
  DiscoveryHubSection,
  DiscoveryRecTile,
} from "@/components/discovery/discovery-hub-tiles";
import {
  DISCOVERY_HUB_BOOK_LIMIT,
  loadDiscoveryHubFeeds,
} from "@/lib/discovery/discovery-hub-feeds";

/**
 * 내 서가 상단 — 베스트셀러·초이스 신간·맞춤 추천 가로 미리보기(각 최대 5권).
 *
 * @history
 * - 2026-05-03: 모바일 발견 탭과 동일하게 프로필 관심 CID 병합 + `/discovery/*` 더보기
 * - 2026-05-03: `loadDiscoveryHubFeeds`·`discovery-hub-tiles`로 발견 허브와 로직 공유
 */
export async function DashboardDiscoveryRails({ userId }: { userId: string }) {
  const {
    categoryHint,
    bestsellerItems,
    choiceItems,
    recItems,
    aladinError,
    recError,
  } = await loadDiscoveryHubFeeds(userId);

  return (
    <section className="mb-8 space-y-8" aria-label="발견 미리보기">
      <p className="text-xs text-[#675d53]">{categoryHint}</p>

      <DiscoveryHubSection
        sectionId="dash-rail-bestseller"
        title="베스트셀러"
        description="국내도서 · 관심 카테고리(또는 기본) 순위"
        moreHref="/discovery/bestsellers"
        moreLabel="더보기"
        error={aladinError}
        emptyMessage="표시할 도서가 없습니다."
      >
        {bestsellerItems.slice(0, DISCOVERY_HUB_BOOK_LIMIT).map((item, i) => (
          <DiscoveryAladinTile key={item.itemId || `${item.isbn13}-${i}`} item={item} rank={i + 1} />
        ))}
      </DiscoveryHubSection>

      <DiscoveryHubSection
        sectionId="dash-rail-choice"
        title="초이스 신간"
        description="알라딘 초이스 신간 피드"
        moreHref="/discovery/choice-new"
        moreLabel="더보기"
        error={aladinError}
        emptyMessage="표시할 도서가 없습니다."
      >
        {choiceItems.slice(0, DISCOVERY_HUB_BOOK_LIMIT).map((item, i) => (
          <DiscoveryAladinTile key={item.itemId || `${item.isbn13}-c-${i}`} item={item} rank={i + 1} />
        ))}
      </DiscoveryHubSection>

      <DiscoveryHubSection
        sectionId="dash-rail-rec"
        title="맞춤 추천"
        description="내 서가 기록으로 만든 선호 프로필 + 인기·신선도 점수"
        moreHref="/discovery/personalized"
        moreLabel="지표와 전체 보기"
        error={recError}
        emptyMessage="추천 후보가 없거나 아직 기록이 부족합니다."
      >
        {recItems.map((item) => (
          <DiscoveryRecTile key={item.bookId} item={item} showAddButton={false} />
        ))}
      </DiscoveryHubSection>

      <p className="text-center text-xs text-[#675d53]">
        <Link
          href={"/discovery" as Route}
          className="font-medium text-[#163826] underline-offset-4 hover:underline"
        >
          발견 허브로 이동
        </Link>
      </p>
    </section>
  );
}
