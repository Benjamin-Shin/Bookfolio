"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { updateAdminAuthorName, type AdminAuthorActionState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? "저장 중…" : "저장"}
    </Button>
  );
}

type AuthorNameFormProps = {
  authorId: string;
  initialName: string;
};

/**
 * 관리자 저자 목록에서 표시명 인라인 수정. 연결된 `books.authors` 는 트리거로 갱신됩니다.
 *
 * @history
 * - 2026-03-24: 초기 추가
 */
export function AuthorNameForm({ authorId, initialName }: AuthorNameFormProps) {
  const [state, formAction] = useActionState(updateAdminAuthorName, null as AdminAuthorActionState | null);

  return (
    <form action={formAction} className="flex min-w-[12rem] max-w-[24rem] flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="authorId" value={authorId} />
        <Input
          name="name"
          type="text"
          defaultValue={initialName}
          maxLength={500}
          className="h-8 min-w-[6rem] flex-1 text-xs"
          aria-label="저자 이름"
          autoComplete="off"
        />
        <SubmitButton />
      </div>
      {state?.error ? (
        <Alert variant="destructive" className="py-2">
          <AlertTitle className="text-xs">저장 실패</AlertTitle>
          <AlertDescription className="text-xs">{state.error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
