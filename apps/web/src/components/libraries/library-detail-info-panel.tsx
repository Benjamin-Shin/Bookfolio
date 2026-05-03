import type { LibrarySummary, LibraryMemberRow } from "@bookfolio/shared";
import type { Route } from "next";
import Link from "next/link";
import { Library, Pencil } from "lucide-react";

import { DeleteLibraryButton } from "@/components/libraries/delete-library-button";
import { LibraryEditDialog } from "@/components/libraries/library-edit-dialog.client";
import { LibraryMembersSidebar } from "@/components/libraries/library-members-sidebar.client";
import { LIBRARY_KIND_LABELS } from "@/components/libraries/reading-status-labels";
import { Button } from "@/components/ui/button";
import { normalizeCoverUrlForClient } from "@/lib/books/cover-url";

export interface LibraryDetailInfoPanelProps {
  libraryId: string;
  lib: LibrarySummary;
  members: LibraryMemberRow[];
  currentUserId: string;
  isOwner: boolean;
  totalDistinctBooks: number;
}

/**
 * 모임서가 상단 정보 카드 — 표지·설명·액션·멤버/초대.
 *
 * @history
 * - 2026-05-04: 서가 수정 — `LibraryEditDialog` 팝업(`/edit` 페이지 대신)
 * - 2026-05-04: 모임서가에서 직접 책 추가 버튼 제거(내 서가 연결만)
 * - 2026-05-04: 신규 — 대시보드 히어로 톤 정렬
 */
export function LibraryDetailInfoPanel({
  libraryId,
  lib,
  members,
  currentUserId,
  isOwner,
  totalDistinctBooks,
}: LibraryDetailInfoPanelProps) {
  const coverSrc = normalizeCoverUrlForClient(lib.imageUrl);

  return (
    <section
      className="mb-8 rounded-2xl border border-[#1A3C2F]/8 bg-white p-6 shadow-[0_8px_30px_rgba(26,60,47,0.06)] md:p-8"
      aria-labelledby="library-detail-info-title"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start lg:col-span-5">
          <div
            className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-[#1A3C2F]/12 bg-[#F8F9FA] shadow-inner sm:size-24"
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
                <Library className="size-10" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#675d53]">
              Shared library
            </p>
            <p className="text-xs font-medium text-[#5c6560]">
              {LIBRARY_KIND_LABELS[lib.kind]}
            </p>
            <h2
              id="library-detail-info-title"
              className="font-serif text-2xl font-semibold tracking-tight text-[#1A3C2F] md:text-3xl"
            >
              {lib.name}
            </h2>
            {lib.description ? (
              <p className="text-sm leading-relaxed text-[#434843]">
                {lib.description}
              </p>
            ) : (
              <p className="text-sm text-[#5c6560]/80">설명이 없습니다.</p>
            )}
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#5c6560]">
              <div>
                <dt className="inline text-[#675d53]">멤버 </dt>
                <dd className="inline font-semibold tabular-nums text-[#1A3C2F]">
                  {members.length.toLocaleString("ko-KR")}명
                </dd>
              </div>
              <div>
                <dt className="inline text-[#675d53]">합본 도서 </dt>
                <dd className="inline font-semibold tabular-nums text-[#1A3C2F]">
                  {totalDistinctBooks.toLocaleString("ko-KR")}권
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={"/libraries" as Route}>모임서가 목록</Link>
            </Button>
            {isOwner ? (
              <LibraryEditDialog libraryId={libraryId} initial={lib}>
                <Button variant="secondary" size="sm" type="button">
                  <Pencil className="mr-1.5 size-3.5" aria-hidden />
                  서가 수정
                </Button>
              </LibraryEditDialog>
            ) : null}
            {isOwner ? <DeleteLibraryButton libraryId={libraryId} /> : null}
          </div>

          <div className="rounded-xl border border-[#1A3C2F]/10 bg-[#F8F9FA]/90 p-4">
            <LibraryMembersSidebar
              libraryId={libraryId}
              initialMembers={members}
              currentUserId={currentUserId}
              isOwner={isOwner}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
