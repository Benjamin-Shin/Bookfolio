import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, Library, Users } from "lucide-react";

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
import { getAppProfile } from "@/lib/auth/app-profiles";
import { getMergedAppUserPoliciesForUser } from "@/lib/auth/app-user-policies";
import { normalizeCoverUrlForClient } from "@/lib/books/cover-url";
import {
  countLibrariesCreatedByUser,
  listLibrariesForUser,
} from "@/lib/libraries/repository";
import { cn } from "@/lib/utils";

import type { LibrarySummary } from "@bookfolio/shared";

/**
 * 모임서가 카드 한 장(허브 그리드).
 *
 * @history
 * - 2026-05-03: 대시보드형 허브에서 분리 — 표지 영역·역할 배지
 */
function LibraryHubCard({ lib }: { lib: LibrarySummary }) {
  const coverSrc = normalizeCoverUrlForClient(lib.imageUrl);
  const roleLabel = lib.myRole === "owner" ? "소유" : "참여";

  return (
    <Link href={`/libraries/${lib.id}` as Route} className="group block">
      <article
        className={cn(
          "flex h-full gap-4 rounded-2xl border border-[#1A3C2F]/10 bg-white p-4 shadow-[0_8px_30px_rgba(26,60,47,0.06)] transition-[box-shadow,transform,border-color]",
          "hover:-translate-y-0.5 hover:border-[#1A3C2F]/18 hover:shadow-[0_14px_40px_rgba(26,60,47,0.1)]",
        )}
      >
        <div
          className={cn(
            "relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-[#1A3C2F]/10 bg-[#F8F9FA]",
            "shadow-inner",
          )}
        >
          {coverSrc ? (
            <img
              src={coverSrc}
              alt=""
              className="size-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="flex size-full items-center justify-center text-[#1A3C2F]/35"
              aria-hidden
            >
              <Library className="size-8" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h2 className="truncate font-serif text-base font-semibold text-[#1A3C2F] group-hover:underline group-hover:underline-offset-2">
              {lib.name}
            </h2>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                lib.myRole === "owner"
                  ? "bg-[#1A3C2F]/10 text-[#1A3C2F]"
                  : "bg-[#c5e6d4]/50 text-[#0f241c]",
              )}
            >
              {roleLabel}
            </span>
            <span className="shrink-0 rounded-full bg-[#efe0d4]/80 px-2 py-0.5 text-[0.65rem] text-[#5c4a3d]">
              {LIBRARY_KIND_LABELS[lib.kind]}
            </span>
          </div>
          {lib.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-[#5c6560]">
              {lib.description}
            </p>
          ) : (
            <p className="text-sm text-[#5c6560]/70">설명이 없습니다.</p>
          )}
        </div>
      </article>
    </Link>
  );
}

/**
 * 모임서가 허브(목록) — 내 서가와 동일한 에디토리얼 셸, 소유·참여 구역 분리.
 *
 * @history
 * - 2026-05-03: 상단 타이틀을 발견 허브와 동일 패턴(영문 라벨·h1·본문)으로 통일, 하단에 내 서가로 돌아가기
 * - 2026-05-03: 좌측 고정 사이드 제거, 대시보드 팔레트·히어로·소유/참여 2구역 그리드
 * - 2026-04-12: `dashboard`형 배경·고정 사이드(내 서가·모임서가 목록)
 * - 2026-03-25: 모임서가 생성 상한 도달 시 「새 모임서가」 버튼 비활성
 */
export default async function LibrariesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const ctx = { userId: session.user.id, useAdmin: true } as const;
  const [libraries, policies, createdCount, appProfile] = await Promise.all([
    listLibrariesForUser(session.user.id, ctx),
    getMergedAppUserPoliciesForUser(session.user.id),
    countLibrariesCreatedByUser(session.user.id, ctx),
    getAppProfile(session.user.id),
  ]);
  const canCreateMore = createdCount < policies.sharedLibraryCreateLimit;

  const ownedLibraries = libraries.filter((l) => l.myRole === "owner");
  const participatingLibraries = libraries.filter((l) => l.myRole === "member");

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
            Libraries
          </p>
          <h1 className="font-serif text-3xl text-[#1A3C2F] md:text-4xl">
            모임서가
          </h1>
          <p className="max-w-2xl text-sm text-[#434843]">
            가족·동호회·오프라인 모임처럼 함께 쓰는 서가입니다. 권마다 멤버 읽기
            상태를 나누고, 초대로 멤버를 늘려 보세요.
          </p>
        </header>

        <section
          className="rounded-2xl border border-[#1A3C2F]/8 bg-white p-6 shadow-[0_8px_30px_rgba(26,60,47,0.06)] md:p-8"
          aria-labelledby="libraries-hub-hero-heading"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#1A3C2F]/[0.08] text-[#1A3C2F]">
                <Library className="size-7" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2
                  id="libraries-hub-hero-heading"
                  className="font-serif text-xl font-semibold tracking-tight text-[#1A3C2F] md:text-2xl"
                >
                  {displayLabel}님의 모임서가
                </h2>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3 lg:flex-col lg:items-end">
              <div className="flex gap-3 rounded-xl border border-[#1A3C2F]/10 bg-[#F8F9FA] px-4 py-3">
                <div className="text-center">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#5c6560]">
                    소유
                  </p>
                  <p className="font-serif text-xl font-semibold text-[#1A3C2F]">
                    {ownedLibraries.length}
                  </p>
                </div>
                <div className="w-px bg-[#1A3C2F]/10" aria-hidden />
                <div className="text-center">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#5c6560]">
                    참여
                  </p>
                  <p className="font-serif text-xl font-semibold text-[#1A3C2F]">
                    {participatingLibraries.length}
                  </p>
                </div>
              </div>
              {canCreateMore ? (
                <Button
                  size="sm"
                  className="bg-[#1A3C2F] hover:bg-[#1A3C2F]/90"
                  asChild
                >
                  <Link href={"/libraries/new" as Route}>새 모임서가</Link>
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
        </section>

        {libraries.length === 0 ? (
          <Card className="border-[#1A3C2F]/12 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-[#1A3C2F]">
                아직 모임서가가 없습니다
              </CardTitle>
              <CardDescription className="text-[#5c6560]">
                첫 서가를 만들거나 초대를 받으면 이곳에 모입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canCreateMore ? (
                <Button className="bg-[#1A3C2F] hover:bg-[#1A3C2F]/90" asChild>
                  <Link href={"/libraries/new" as Route}>모임서가 만들기</Link>
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
          <div className="space-y-12">
            <section aria-labelledby="libraries-owned-heading">
              <div className="mb-4 flex items-center gap-2">
                <Crown className="size-5 shrink-0 text-[#b8860b]" aria-hidden />
                <h2
                  id="libraries-owned-heading"
                  className="font-serif text-lg font-semibold text-[#1A3C2F]"
                >
                  내가 만든 모임서가
                </h2>
                <span className="rounded-full bg-[#1A3C2F]/10 px-2 py-0.5 text-xs font-medium text-[#1A3C2F]">
                  {ownedLibraries.length}곳
                </span>
              </div>
              {ownedLibraries.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#1A3C2F]/15 bg-white/60 px-4 py-8 text-center text-sm text-[#5c6560]">
                  직접 만든 모임서가가 없습니다.{" "}
                  {canCreateMore ? (
                    <Link
                      href={"/libraries/new" as Route}
                      className="font-medium text-[#1A3C2F] underline-offset-2 hover:underline"
                    >
                      새로 만들기
                    </Link>
                  ) : null}
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {ownedLibraries.map((lib) => (
                    <li key={lib.id}>
                      <LibraryHubCard lib={lib} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="libraries-joined-heading">
              <div className="mb-4 flex items-center gap-2">
                <Users
                  className="size-5 shrink-0 text-[#1A3C2F]/70"
                  aria-hidden
                />
                <h2
                  id="libraries-joined-heading"
                  className="font-serif text-lg font-semibold text-[#1A3C2F]"
                >
                  초대로 참여 중인 모임서가
                </h2>
                <span className="rounded-full bg-[#c5e6d4]/40 px-2 py-0.5 text-xs font-medium text-[#0f241c]">
                  {participatingLibraries.length}곳
                </span>
              </div>
              {participatingLibraries.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#1A3C2F]/15 bg-white/60 px-4 py-8 text-center text-sm text-[#5c6560]">
                  다른 사람이 만든 모임서가에 초대되면 여기에 표시됩니다.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {participatingLibraries.map((lib) => (
                    <li key={lib.id}>
                      <LibraryHubCard lib={lib} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        <p>
          <Button variant="outline" asChild>
            <Link href={"/dashboard" as Route}>내 서가로 돌아가기</Link>
          </Button>
        </p>
      </div>
    </main>
  );
}
