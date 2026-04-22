import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AladinCategoryCascadeFilter } from "@/components/dashboard/aladin-category-cascade-filter";
import { AladinTtbItemListView } from "@/components/dashboard/aladin-ttb-item-list-view";
import { ALADIN_CATEGORY_OPTIONS } from "@/lib/aladin/categories";
import { buildAladinCategoryFilterOptions } from "@/lib/aladin/category-filter";
import { fetchAladinItemList } from "@/lib/aladin/item-list";
import { env } from "@/lib/env";

/**
 * 알라딘 초이스 신간(QueryType=ItemNewSpecial) 목록.
 *
 * @history
 * - 2026-04-22: `CategoryId` 필터 + `ALADIN_API_BASE_URL` 조합형 호출
 * - 2026-03-25: 초이스 신간 페이지 추가
 */
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    mall?: string;
    depth1?: string;
    depth2?: string;
    depth3?: string;
  }>;
};

export default async function DashboardChoiceNewPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const sp = await searchParams;
  const selectedMall = sp.mall?.trim() || "";
  const selectedDepth1 = sp.depth1?.trim() || "";
  const selectedDepth2 = sp.depth2?.trim() || "";
  const selectedDepth3 = sp.depth3?.trim() || "";
  const filter = buildAladinCategoryFilterOptions(ALADIN_CATEGORY_OPTIONS, {
    mall: selectedMall,
    depth1: selectedDepth1,
    depth2: selectedDepth2,
    depth3: selectedDepth3
  });
  const categoryId = filter.categoryId;
  const url = env.aladinApiBaseUrl;
  let feed: Awaited<ReturnType<typeof fetchAladinItemList>> | null = null;
  let loadError: string | null = null;

  if (!url) {
    loadError = "ALADIN_API_BASE_URL 가 설정되어 있지 않습니다.";
  } else {
    try {
      feed = await fetchAladinItemList(url, {
        queryType: "ItemNewSpecial",
        categoryId
      });
    } catch (e) {
      loadError =
        e instanceof Error
          ? e.message
          : "초이스 신간 목록을 불러오지 못했습니다.";
    }
  }

  return (
    <AladinTtbItemListView
      feed={feed}
      loadError={loadError}
      pageTitle="초이스 신간"
      pageDescription="신간 목록입니다."
      filters={
        <AladinCategoryCascadeFilter
          actionPath="/dashboard/choice-new"
          malls={filter.malls}
          depth1={filter.depth1}
          depth2={filter.depth2}
          depth3={filter.depth3}
          selectedMall={selectedMall}
          selectedDepth1={selectedDepth1}
          selectedDepth2={selectedDepth2}
          selectedDepth3={selectedDepth3}
        />
      }
    />
  );
}
