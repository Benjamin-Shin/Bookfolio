import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AladinTtbItemListView } from "@/components/dashboard/aladin-ttb-item-list-view";
import { fetchAladinBestsellerFeed } from "@/lib/aladin/bestseller-feed";
import { env } from "@/lib/env";

/**
 * 알라딘 초이스 신간 등 `ALADIN_ITEMNEW_API_BASE_URL` 기반 목록.
 *
 * @history
 * - 2026-03-25: 초이스 신간 페이지 추가
 */
export const dynamic = "force-dynamic";

export default async function DashboardChoiceNewPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const url = env.aladinItemNewApiBaseUrl;
  let feed: Awaited<ReturnType<typeof fetchAladinBestsellerFeed>> | null = null;
  let loadError: string | null = null;

  if (!url) {
    loadError = "ALADIN_ITEMNEW_API_BASE_URL 가 설정되어 있지 않습니다.";
  } else {
    try {
      feed = await fetchAladinBestsellerFeed(url);
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
    />
  );
}
