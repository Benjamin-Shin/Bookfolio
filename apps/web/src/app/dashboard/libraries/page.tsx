import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Library as LibraryIcon } from "lucide-react";

import { auth } from "@/auth";
import { LIBRARY_KIND_LABELS } from "@/components/libraries/reading-status-labels";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMergedAppUserPoliciesForUser } from "@/lib/auth/app-user-policies";
import { cn } from "@/lib/utils";
import {
  countLibrariesCreatedByUser,
  listLibrariesForUser,
} from "@/lib/libraries/repository";

/**
 * 모임서가 허브(목록) — 내 서가와 동일한 에디토리얼 셸·좌측 네비.
 *
 * @history
 * - 2026-04-12: `dashboard`형 배경·고정 사이드(내 서가·모임서가 목록)
 * - 2026-03-25: 모임서가 생성 상한 도달 시 「새 모임서가」 버튼 비활성
 */
export default async function LibrariesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const ctx = { userId: session.user.id, useAdmin: true } as const;
  const [libraries, policies, createdCount] = await Promise.all([
    listLibrariesForUser(session.user.id, ctx),
    getMergedAppUserPoliciesForUser(session.user.id),
    countLibrariesCreatedByUser(session.user.id, ctx),
  ]);
  const canCreateMore = createdCount < policies.sharedLibraryCreateLimit;

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-[#1b1c19] selection:bg-[#e9c176] selection:text-[#261900]">
      <div className="flex min-h-screen">
        <aside
          className="fixed left-0 top-20 z-40 hidden h-[calc(100vh-5rem)] w-64 flex-col overflow-y-auto border-r border-[#051b0e]/10 bg-[#fbf9f4] px-6 py-8 lg:flex"
          aria-label="모임서가 메뉴"
        >
          <div className="mb-10">
            <h3 className="mb-1 font-sans text-[0.75rem] font-bold uppercase tracking-widest text-[#051b0e]">
              서가담
            </h3>
            <p className="font-sans text-[0.65rem] text-[#1a3021]/60">
              모임서가 허브
            </p>
          </div>
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-[#1a3021]/70 transition-transform hover:translate-x-1 hover:bg-[#1a3021]/5",
              )}
            >
              <LibraryIcon className="size-5 shrink-0 opacity-70" aria-hidden />
              <span className="font-sans text-[0.75rem] uppercase tracking-widest">
                내 서가
              </span>
            </Link>
            <div
              className={cn(
                "flex items-center gap-3 border-l-2 border-[#e9c176] bg-[#1a3021]/5 px-4 py-3 font-bold text-[#051b0e]",
              )}
            >
              <LibraryIcon className="size-5 shrink-0" aria-hidden />
              <span className="font-sans text-[0.75rem] uppercase tracking-widest">
                모임서가
              </span>
            </div>
          </nav>

          {libraries.length > 0 ? (
            <div className="mt-10 border-t border-[#051b0e]/10 pt-8">
              <p className="mb-3 font-sans text-[0.65rem] font-bold uppercase tracking-widest text-[#051b0e]/80">
                내 모임·가족 서가
              </p>
              <ul className="space-y-1">
                {libraries.map((lib) => (
                  <li key={lib.id}>
                    <Link
                      href={`/dashboard/libraries/${lib.id}` as Route}
                      className="block truncate rounded-md px-3 py-2 text-sm text-[#1a3021]/80 transition-colors hover:bg-[#1a3021]/5 hover:text-[#051b0e]"
                    >
                      {lib.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>

        <main className="flex-1 px-6 pb-24 pt-10 md:px-12 lg:ml-64 lg:px-16">
          <div className="mb-2 lg:hidden">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#163826] underline-offset-4 hover:underline"
            >
              ← 내 서가
            </Link>
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-sans text-2xl font-bold italic text-[#051b0e]">
                모임서가
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[#434843]">
                가족·오프라인 모임 등 함께 쓰는 책장입니다. 권당 멤버별 읽기
                상태를 둡니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canCreateMore ? (
                <Button
                  size="sm"
                  className="bg-[#1a3021] hover:bg-[#1a3021]/90"
                  asChild
                >
                  <Link href={"/dashboard/libraries/new" as Route}>
                    새 모임서가
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  type="button"
                  disabled
                  title="소유 모임서가 개수 상한에 도달했습니다."
                >
                  새 모임서가
                </Button>
              )}
            </div>
          </div>

          {libraries.length === 0 ? (
            <Card className="border-[#051b0e]/15 bg-white/50">
              <CardHeader>
                <CardTitle className="font-serif text-[#051b0e]">
                  아직 모임서가가 없습니다
                </CardTitle>
                <CardDescription>
                  첫 서가를 만들고 멤버를 초대해 보세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canCreateMore ? (
                  <Button
                    className="bg-[#1a3021] hover:bg-[#1a3021]/90"
                    asChild
                  >
                    <Link href={"/dashboard/libraries/new" as Route}>
                      모임서가 만들기
                    </Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    소유 모임서가는 최대 {policies.sharedLibraryCreateLimit}
                    개까지 만들 수 있습니다.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {libraries.map((lib) => (
                <li key={lib.id}>
                  <Link href={`/dashboard/libraries/${lib.id}` as Route}>
                    <Card className="border-[#051b0e]/10 bg-white/40 transition-colors hover:bg-[#1a3021]/5">
                      <CardHeader className="py-4">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg font-serif text-[#051b0e]">
                            {lib.name}
                          </CardTitle>
                          <span className="shrink-0 rounded-full bg-[#efe0d4] px-2 py-0.5 text-xs text-[#675d53]">
                            {LIBRARY_KIND_LABELS[lib.kind]}
                          </span>
                        </div>
                        {lib.description ? (
                          <CardDescription className="line-clamp-2 text-[#434843]">
                            {lib.description}
                          </CardDescription>
                        ) : null}
                      </CardHeader>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
