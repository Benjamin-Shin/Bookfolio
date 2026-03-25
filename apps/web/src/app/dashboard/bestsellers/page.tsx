import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AladinTtbItemListView } from "@/components/dashboard/aladin-ttb-item-list-view";
import { fetchAladinBestsellerFeed } from "@/lib/aladin/bestseller-feed";
import { env } from "@/lib/env";

/**
 * 알라딘 연동 베스트셀러(또는 env URL의 QueryType).
 *
 * @history
 * - 2026-03-25: 그리드 UI `AladinTtbItemListView`로 이전
 * - 2026-03-25: `force-dynamic` — 빌드·캐시 시점에 env가 비어 고정되는 것 방지
 * - 2026-03-25: 대시보드 베스트셀러(피드) 페이지 추가
 */
export const dynamic = "force-dynamic";

export default async function DashboardBestsellersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const url = env.aladinBestsellerApiBaseUrl;
  let feed: Awaited<ReturnType<typeof fetchAladinBestsellerFeed>> | null = null;
  let loadError: string | null = null;

  if (!url) {
    loadError = "ALADIN_BESTSELLER_API_BASE_URL 가 설정되어 있지 않습니다.";
  } else {
    try {
      feed = await fetchAladinBestsellerFeed(url);
    } catch (e) {
      loadError =
        e instanceof Error ? e.message : "베스트셀러 목록을 불러오지 못했습니다.";
    }
  }

  return (
    <AladinTtbItemListView
      feed={feed}
      loadError={loadError}
      pageTitle="베스트셀러"
      pageDescription="베스트셀러 목록입니다."
    />
  );
}
