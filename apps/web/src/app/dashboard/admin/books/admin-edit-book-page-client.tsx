"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useState } from "react";

import { AdminBookDeleteForm } from "./admin-book-delete-form";
import {
  AdminCanonicalBookForm,
  type AdminCanonicalBookFormValues,
} from "./admin-canonical-book-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
const EDIT_BOOK_FORM_ID = "admin-edit-canonical-book";

export type AdminEditBookPageClientProps = {
  book: {
    id: string;
    title: string;
    source: string;
    api_source: string | null;
  };
  metaLine: {
    totalRefs: number;
    ownedRefs: number;
  };
  defaultValues: AdminCanonicalBookFormValues;
  deleteDisabled: boolean;
  deleteTitle: string;
};

/**
 * 관리자 도서 수정 화면 — 상·하단 저장·목록 툴바와 `AdminCanonicalBookForm` 연동.
 *
 * @history
 * - 2026-03-26: `useActionState`의 pending과 `form` 속성으로 이중 툴바
 */
function EditBookToolbar({
  formId,
  pending,
  booksListHref,
}: {
  formId: string;
  pending: boolean;
  booksListHref: Route;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={booksListHref}>목록으로</Link>
      </Button>
      <Button type="submit" form={formId} size="sm" disabled={pending}>
        {pending ? "처리 중…" : "저장"}
      </Button>
    </div>
  );
}

export function AdminEditBookPageClient({
  book,
  metaLine,
  defaultValues,
  deleteDisabled,
  deleteTitle,
}: AdminEditBookPageClientProps) {
  const [savePending, setSavePending] = useState(false);
  const onSubmitPendingChange = useCallback((p: boolean) => {
    setSavePending(p);
  }, []);

  const booksListHref = "/dashboard/admin/books" as Route;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">도서 수정</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            카탈로그 출처:{" "}
            <span className="font-mono text-xs">{book.source}</span>
            {book.api_source ? (
              <>
                {" "}
                · API소스:{" "}
                <span className="font-mono text-xs">{book.api_source}</span>
              </>
            ) : null}
            {metaLine.totalRefs > 0 ? (
              <>
                {" "}
                · 서가 연결 {metaLine.totalRefs}건
                {metaLine.ownedRefs > 0
                  ? ` (소장 ${metaLine.ownedRefs}건)`
                  : null}
              </>
            ) : null}
          </p>
        </div>
        <EditBookToolbar
          formId={EDIT_BOOK_FORM_ID}
          pending={savePending}
          booksListHref={booksListHref}
        />
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>{book.title}</CardTitle>
          <CardDescription>
            공유 서지 필드를 수정합니다. 연결된 모든 사용자에게 반영됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <AdminCanonicalBookForm
            mode="edit"
            bookId={book.id}
            defaultValues={defaultValues}
            formHtmlId={EDIT_BOOK_FORM_ID}
            onSubmitPendingChange={onSubmitPendingChange}
          />

          <Separator />

          <div className="space-y-2">
            <h2 className="text-sm font-medium">삭제</h2>
            <p className="text-xs text-muted-foreground">
              {deleteDisabled
                ? deleteTitle
                : "서가에 연결된 기록이 없을 때만 삭제할 수 있습니다."}
            </p>
            <AdminBookDeleteForm bookId={book.id} disabled={deleteDisabled} />
          </div>

          <div className="flex flex-wrap justify-end border-t border-border/60 pt-6">
            <EditBookToolbar
              formId={EDIT_BOOK_FORM_ID}
              pending={savePending}
              booksListHref={booksListHref}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
