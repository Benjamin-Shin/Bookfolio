"use client";

import { useState, useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { deleteAdminAuthorsWithZeroBooks } from "./actions";

type DeleteZeroBookAuthorsButtonProps = {
  orphanCount: number;
};

/**
 * 연결 도서가 없는 저자 마스터 일괄 삭제. 확인 후 서버 액션 호출.
 *
 * @history
 * - 2026-03-24: 초기 추가
 */
export function DeleteZeroBookAuthorsButton({ orphanCount }: DeleteZeroBookAuthorsButtonProps) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  function handleClick() {
    if (orphanCount <= 0 || pending) return;
    const ok = window.confirm(
      `연결 도서가 없는 저자 ${orphanCount}명을 삭제합니다. 되돌릴 수 없습니다. 계속할까요?`
    );
    if (!ok) return;

    setFeedback(null);
    startTransition(async () => {
      const result = await deleteAdminAuthorsWithZeroBooks();
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
        return;
      }
      if (result.deleted === 0) {
        setFeedback({ ok: true, text: "삭제할 저자가 없습니다. 목록을 새로고침했습니다." });
        return;
      }
      setFeedback({ ok: true, text: `${result.deleted}명의 저자를 삭제했습니다.` });
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={orphanCount <= 0 || pending}
        onClick={handleClick}
      >
        {pending ? "삭제 중…" : `연결 도서 없는 저자 일괄 삭제 (${orphanCount}명)`}
      </Button>
      {feedback ? (
        <Alert variant={feedback.ok ? "default" : "destructive"} className="py-2">
          <AlertTitle className="text-xs">{feedback.ok ? "완료" : "실패"}</AlertTitle>
          <AlertDescription className="text-xs">{feedback.text}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
