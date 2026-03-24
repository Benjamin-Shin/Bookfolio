"use client";

import { useFormStatus } from "react-dom";

import { setUserDisplayNameFromForm } from "@/app/dashboard/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? "저장 중…" : "저장"}
    </Button>
  );
}

type UserNameFormProps = {
  userId: string;
  initialName: string | null;
};

/**
 * 관리자 사용자 테이블에서 표시명을 입력·저장합니다.
 *
 * @history
 * - 2026-03-24: 초기 추가 (관리자 사용자 목록 인라인 이름 수정)
 */
export function UserNameForm({ userId, initialName }: UserNameFormProps) {
  return (
    <form
      action={setUserDisplayNameFromForm}
      className="flex min-w-[12rem] max-w-[22rem] flex-wrap items-center gap-2"
    >
      <input type="hidden" name="userId" value={userId} />
      <Input
        name="displayName"
        type="text"
        defaultValue={initialName ?? ""}
        maxLength={200}
        className="h-8 min-w-[6rem] flex-1 text-xs"
        aria-label="이름"
        autoComplete="off"
      />
      <SubmitButton />
    </form>
  );
}
