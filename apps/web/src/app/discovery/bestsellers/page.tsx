import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getAppProfile } from "@/lib/auth/app-profiles";
import { AladinCategoryCascadeFilter } from "@/components/dashboard/aladin-category-cascade-filter";
import { AladinTtbItemListView } from "@/components/dashboard/aladin-ttb-item-list-view";
import { ALADIN_CATEGORY_OPTIONS } from "@/lib/aladin/categories";
import { buildAladinCategoryFilterOptions } from "@/lib/aladin/category-filter";
import { fetchAladinItemList } from "@/lib/aladin/item-list";
import {
  DISCOVERY_DEFAULT_ALADIN_CATEGORY_ID,
  DISCOVERY_PROFILE_MERGED_LIST_CAP,
  mergedAladinFeedForProfileDiscoveryList,
} from "@/lib/discovery/merged-aladin-by-profile";
import { env } from "@/lib/env";

/**
 * 알라딘 연동 베스트셀러(또는 env URL의 QueryType).
 *
 * @history
 * - 2026-04-22: `CategoryId` 필터 + `ALADIN_API_BASE_URL` 조합형 호출
 * - 2026-03-25: 그리드 UI `AladinTtbItemListView`로 이전
 * - 2026-03-25: `force-dynamic` — 빌드·캐시 시점에 env가 비어 고정되는 것 방지
 * - 2026-03-25: 대시보드 베스트셀러(피드) 페이지 추가
 * - 2026-05-03: 경로 `/discovery/bestsellers`, 필터 action·뒤로가기 발견 허브 연동
 * - 2026-05-05: 1차 분류 미선택 시 프로필 관심 CID 병합·판매지수 순 최대 30권
 */
export const dynamic = "force-dynamic";
const DOMESTIC_MALL = "국내도서";

type PageProps = {
  searchParams: Promise<{
    mall?: string;
    depth1?: string;
    depth2?: string;
    depth3?: string;
  }>;
};

export default async function DashboardBestsellersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const sp = await searchParams;
  const selectedMall = DOMESTIC_MALL;
  const selectedDepth1 = sp.depth1?.trim() || "";
  const selectedDepth2 = "";
  const selectedDepth3 = "";
  const filter = buildAladinCategoryFilterOptions(ALADIN_CATEGORY_OPTIONS, {
    mall: selectedMall,
    depth1: selectedDepth1,
    depth2: selectedDepth2,
    depth3: selectedDepth3
  });
  const categoryId = filter.categoryId;
  const url = env.aladinApiBaseUrl;

  const profile = await getAppProfile(session.user.id);
  const favoriteIds = profile?.favoriteAladinCategoryIds ?? [];
  const categoryIdsForMerge =
    favoriteIds.length > 0 ? favoriteIds : [DISCOVERY_DEFAULT_ALADIN_CATEGORY_ID];

  let feed: Awaited<ReturnType<typeof fetchAladinItemList>> | null = null;
  let loadError: string | null = null;

  if (!url) {
    loadError = "ALADIN_API_BASE_URL 가 설정되어 있지 않습니다.";
  } else {
    try {
      if (!selectedDepth1) {
        feed = await mergedAladinFeedForProfileDiscoveryList(
          url,
          "Bestseller",
          categoryIdsForMerge,
        );
      } else {
        feed = await fetchAladinItemList(url, {
          queryType: "Bestseller",
          categoryId,
          maxResults: DISCOVERY_PROFILE_MERGED_LIST_CAP,
        });
      }
    } catch (e) {
      loadError =
        e instanceof Error ? e.message : "베스트셀러 목록을 불러오지 못했습니다.";
    }
  }

  const pageDescription = !selectedDepth1
    ? favoriteIds.length > 0
      ? `프로필에 설정한 관심 카테고리 ${favoriteIds.length}개를 합쳐, 판매지수 순으로 최대 ${DISCOVERY_PROFILE_MERGED_LIST_CAP}권을 보여 줍니다. 특정 1차 분류만 보려면 아래에서 선택하세요.`
      : `기본 카테고리(소설, CID ${DISCOVERY_DEFAULT_ALADIN_CATEGORY_ID}) 기준으로 합산한 뒤 판매지수 순 최대 ${DISCOVERY_PROFILE_MERGED_LIST_CAP}권입니다. 프로필에서 관심 카테고리를 최대 5개까지 설정하면 함께 반영됩니다. 특정 분류만 보려면 아래에서 선택하세요.`
    : `선택한 분류의 베스트셀러입니다 (최대 ${DISCOVERY_PROFILE_MERGED_LIST_CAP}권).`;

  return (
    <AladinTtbItemListView
      feed={feed}
      loadError={loadError}
      pageTitle="베스트셀러"
      pageDescription={pageDescription}
      sectionEyebrow="발견"
      backHref="/discovery"
      backLabel="발견으로"
      itemLinkMode="discovery"
      filters={
        <AladinCategoryCascadeFilter
          actionPath="/discovery/bestsellers"
          malls={filter.malls}
          depth1={filter.depth1}
          depth2={filter.depth2}
          depth3={filter.depth3}
          selectedMall={selectedMall}
          selectedDepth1={selectedDepth1}
          selectedDepth2={selectedDepth2}
          selectedDepth3={selectedDepth3}
          mallFixed
          depth1Only
        />
      }
    />
  );
}
