"use client";

import type { LibrarySummary } from "@bookfolio/shared";
import { useState, type ReactNode } from "react";

import { LibraryEditForm } from "@/components/libraries/library-edit-form.client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface LibraryEditDialogProps {
  libraryId: string;
  initial: LibrarySummary;
  children: ReactNode;
}

/**
 * 모임서가 메타 수정 — 상세 화면에서 다이얼로그로 열기.
 *
 * @history
 * - 2026-05-04: 신규 — `/libraries/:id/edit` 페이지 이동 대체
 */
export function LibraryEditDialog({
  libraryId,
  initial,
  children,
}: LibraryEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="flex max-h-[min(90vh,56rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-6 py-4 text-left">
          <DialogTitle className="font-serif text-[#1A3C2F]">모임서가 수정</DialogTitle>
          <DialogDescription className="text-[#5c6560]">
            이름·종류·설명·대표 이미지를 바꿀 수 있습니다. 저장하면 이 화면에 바로 반영됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
          <LibraryEditForm
            key={initial.updatedAt}
            libraryId={libraryId}
            initial={initial}
            variant="embedded"
            onSaved={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
