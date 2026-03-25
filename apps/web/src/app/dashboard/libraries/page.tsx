import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LIBRARY_KIND_LABELS } from "@/components/libraries/reading-status-labels";
import { getMergedAppUserPoliciesForUser } from "@/lib/auth/app-user-policies";
import { countLibrariesCreatedByUser, listLibrariesForUser } from "@/lib/libraries/repository";

/**
 * @history
 * - 2026-03-25: 공동서재 생성 상한 도달 시 「새 공동서재」 버튼 비활성
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
    countLibrariesCreatedByUser(session.user.id, ctx)
  ]);
  const canCreateMore = createdCount < policies.sharedLibraryCreateLimit;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">공동서재</h1>
          <p className="text-sm text-muted-foreground">가족·오프라인 모임 등 함께 쓰는 책장입니다. 권당 멤버별 읽기 상태를 둡니다.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">내 서재</Link>
          </Button>
          {canCreateMore ? (
            <Button size="sm" asChild>
              <Link href={"/dashboard/libraries/new" as Route}>새 공동서재</Link>
            </Button>
          ) : (
            <Button size="sm" type="button" disabled title="소유 공동서재 개수 상한에 도달했습니다.">
              새 공동서재
            </Button>
          )}
        </div>
      </div>

      {libraries.length === 0 ? (
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>아직 공동서재가 없습니다</CardTitle>
            <CardDescription>첫 서재를 만들고 멤버를 초대해 보세요.</CardDescription>
          </CardHeader>
          <CardContent>
            {canCreateMore ? (
              <Button asChild>
                <Link href={"/dashboard/libraries/new" as Route}>공동서재 만들기</Link>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                소유 공동서재는 최대 {policies.sharedLibraryCreateLimit}개까지 만들 수 있습니다.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {libraries.map((lib) => (
            <li key={lib.id}>
              <Link href={`/dashboard/libraries/${lib.id}` as Route}>
                <Card className="border-border/80 transition-colors hover:bg-muted/40">
                  <CardHeader className="py-4">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{lib.name}</CardTitle>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {LIBRARY_KIND_LABELS[lib.kind]}
                      </span>
                    </div>
                    {lib.description ? (
                      <CardDescription className="line-clamp-2">{lib.description}</CardDescription>
                    ) : null}
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
