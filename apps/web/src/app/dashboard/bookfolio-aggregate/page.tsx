import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { getBookfolioAggregate } from "@/lib/stats/bookfolio-aggregate";
import { cn } from "@/lib/utils";

/**
 * 회원·도서 집계 TOP10(소장·완독·포인트·인기 소장 도서).
 *
 * @history
 * - 2026-04-05: 페이지 제목 사용자 노출 「서가담 집계」
 * - 2026-03-28: 신규
 */
export const dynamic = "force-dynamic";

function LeaderboardSection({
  title,
  description,
  suffix,
  data,
  className
}: {
  title: string;
  description: string;
  suffix: string;
  data: Awaited<ReturnType<typeof getBookfolioAggregate>>["ownedBooks"];
  className?: string;
}) {
  const { top, me } = data;
  return (
    <Card className={cn("border-border/80", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <p className="pt-1 text-sm text-muted-foreground">
          {me.rank != null ? (
            <>
              내 순위: <span className="font-medium text-foreground">{me.rank}위</span> ·{" "}
              {me.count}
              {suffix} (집계 대상 {me.totalRankedUsers}명)
            </>
          ) : (
            <>
              내 순위: 집계에 없음 · {me.count}
              {suffix} (집계 대상 {me.totalRankedUsers}명)
            </>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {top.length === 0 ? (
            <li className="text-sm text-muted-foreground">아직 표시할 데이터가 없습니다.</li>
          ) : (
            top.map((row, idx) => (
              <li
                key={row.userId}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {idx + 1}
                  </Badge>
                  <span className="truncate font-medium">
                    {row.displayName?.trim() || "사용자"}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-sm text-muted-foreground">
                  {row.count}
                  {suffix}
                </span>
              </li>
            ))
          )}
        </ol>
      </CardContent>
    </Card>
  );
}

export default async function BookfolioAggregatePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let payload: Awaited<ReturnType<typeof getBookfolioAggregate>> | null = null;
  let loadError: string | null = null;
  try {
    payload = await getBookfolioAggregate(10, {
      userId: session.user.id,
      useAdmin: true
    });
  } catch (e) {
    loadError = e instanceof Error ? e.message : "집계를 불러오지 못했습니다.";
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
          <h1 className="font-serif text-3xl font-medium tracking-tight">
            서가담 집계
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            회원 기준 소장·완독·포인트 순위와, 많은 회원이 소장으로 등록한 도서 TOP 10입니다.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={"/dashboard" as Route}>내 서재로</Link>
        </Button>
      </div>

      {loadError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>데이터를 불러올 수 없습니다</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
        </Card>
      ) : payload ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <LeaderboardSection
            title="소장 건수 순위"
            description="소장으로 등록한 권수가 많은 순 (TOP 10)"
            suffix="권"
            data={payload.ownedBooks}
          />
          <LeaderboardSection
            title="완독 순위"
            description='읽기 상태가 "완독"인 권수 (TOP 10)'
            suffix="권"
            data={payload.completedBooks}
          />
          <Card className="border-border/80 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">소장 책 순위</CardTitle>
              <CardDescription>
                여러 회원이 소장으로 등록한 동일 도서(표지·제목) — 소장 등록 획수 기준 TOP 10
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {payload.popularOwnedBooks.top.length === 0 ? (
                  <li className="text-sm text-muted-foreground">아직 표시할 데이터가 없습니다.</li>
                ) : (
                  payload.popularOwnedBooks.top.map((b, idx) => (
                    <li
                      key={b.bookId}
                      className="flex flex-col overflow-hidden rounded-lg border border-border/60 bg-muted/20"
                    >
                      <div className="relative aspect-[2/3] w-full bg-muted">
                        {b.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- 외부 표지 URL(동적 호스트) 허용
                          <img
                            src={b.coverUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            표지 없음
                          </div>
                        )}
                        <Badge
                          className="absolute left-2 top-2 shadow-sm"
                          variant="secondary"
                        >
                          {idx + 1}
                        </Badge>
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug">{b.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.ownerCount}명 소장 등록
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
          <LeaderboardSection
            title="포인트 순위"
            description="현재 포인트 잔액이 많은 순 (TOP 10)"
            suffix="P"
            data={payload.points}
            className="lg:col-span-2"
          />
        </div>
      ) : null}
    </main>
  );
}
