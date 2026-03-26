"use client";

import type { Route } from "next";
import Link from "next/link";
import { useActionState } from "react";

import { initialAladinBulkImportState } from "./admin-aladin-bulk-import-state";
import { bulkImportAladinCatalogNotInBooks } from "./actions";
import { Button } from "@/components/ui/button";

const NEW_BOOK_HREF = "/dashboard/admin/books/new" as Route;

export type AdminBooksTopActionsProps = {
  hasAladinConfig: boolean;
};

/**
 * 도서 관리 상단 — 「도서 추가」 링크와 알라딘 「빠르게 추가」 일괄 등록.
 *
 * @history
 * - 2026-03-26: 알라딘 일괄 등록 버튼을 「도서 추가」 옆에 배치
 */
export function AdminBooksTopActions({ hasAladinConfig }: AdminBooksTopActionsProps) {
  const [state, formAction, isPending] = useActionState(
    bulkImportAladinCatalogNotInBooks,
    initialAladinBulkImportState
  );

  return (
    <div className="flex min-w-0 flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" asChild>
          <Link href={NEW_BOOK_HREF}>도서 추가</Link>
        </Button>
        <form action={formAction} className="inline">
          <Button type="submit" variant="secondary" size="sm" disabled={!hasAladinConfig || isPending}>
            {isPending ? "가져오는 중…" : "빠르게 추가"}
          </Button>
        </form>
      </div>
      {!hasAladinConfig ? (
        <p className="max-w-md text-right text-xs text-muted-foreground">
          ALADIN_BESTSELLER_API_BASE_URL 또는 ALADIN_ITEMNEW_API_BASE_URL을 설정하면, 오늘 베스트셀러·초이스 신간 중
          아직 books에 없는 ISBN만 일괄 등록할 수 있습니다.
        </p>
      ) : null}
      {state.error ? (
        <p className="max-w-md text-right text-sm text-destructive">{state.error}</p>
      ) : state.message ? (
        <p className="max-w-md text-right text-sm text-muted-foreground">{state.message}</p>
      ) : null}
    </div>
  );
}
