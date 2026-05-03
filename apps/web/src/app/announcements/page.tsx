import Link from "next/link";

import { listPublishedSiteAnnouncements } from "@/lib/site/announcements-repository";

/**
 * 게시 중인 전역 공지 목록(로그인 여부 무관).
 *
 * @history
 * - 2026-05-04: 레이아웃을 대시보드·발견 허브와 동일 (`main` 패딩·`max-w-6xl`·배경·타이포 토큰)
 * - 2026-05-04: 신규
 */
export default async function AnnouncementsPage() {
  let announcements: Awaited<ReturnType<typeof listPublishedSiteAnnouncements>> = [];
  let loadError: string | null = null;
  try {
    announcements = await listPublishedSiteAnnouncements();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "목록을 불러오지 못했습니다.";
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 pb-28 pt-8 text-[#1b1c19] selection:bg-[#c5e6d4] selection:text-[#0f241c] md:px-8 md:pb-24 md:pt-10 lg:px-12">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#675d53]">
            Notice
          </p>
          <h1 className="font-serif text-3xl text-[#1A3C2F] md:text-4xl">공지사항</h1>
          <p className="max-w-2xl text-sm text-[#434843]">
            서비스 안내와 업데이트 소식입니다.{" "}
            <Link
              href="/dashboard"
              className="underline underline-offset-4 hover:text-[#1A3C2F]"
            >
              내 서가로 돌아가기
            </Link>
          </p>
        </header>

        {loadError ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {loadError}
          </p>
        ) : null}

        {announcements.length === 0 && !loadError ? (
          <p className="text-sm text-[#434843]">등록된 공지가 없습니다.</p>
        ) : null}

        <div className="space-y-6">
          {announcements.map((row) => (
            <article
              key={row.id}
              id={row.id}
              className="scroll-mt-24 rounded-lg border border-[#1A3C2F]/10 bg-white p-5 shadow-sm"
            >
              <header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[#1A3C2F]/10 pb-3">
                <h2 className="text-lg font-semibold text-[#1b1c19]">{row.title}</h2>
                {row.published_at ? (
                  <time
                    className="text-xs text-[#675d53]"
                    dateTime={row.published_at}
                  >
                    {new Date(row.published_at).toLocaleString("ko-KR")}
                  </time>
                ) : null}
              </header>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#434843]">
                {row.body}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
