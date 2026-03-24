"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createAdminAuthor, type AdminAuthorActionState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "추가 중…" : "저자 추가"}
    </Button>
  );
}

/**
 * 관리자: 저자 마스터 신규 행 추가 (도서와 무관한 고아 저자 허용).
 *
 * @history
 * - 2026-03-24: 초기 추가
 */
export function AdminAuthorCreateForm() {
  const [state, formAction] = useActionState(createAdminAuthor, null as AdminAuthorActionState | null);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4">
      <div className="space-y-2">
        <Label htmlFor="admin-new-author-name">신규 저자</Label>
        <p className="text-xs text-muted-foreground">
          표시명 기준으로 중복이 감지됩니다(앞뒤 공백 제거·대소문자 무시). 도서에 먼저 연결하지 않아도 됩니다.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            id="admin-new-author-name"
            name="name"
            placeholder="예: 한강"
            maxLength={500}
            className="sm:max-w-md"
            autoComplete="off"
          />
          <SubmitButton />
        </div>
      </div>
      {state?.error ? (
        <Alert variant="destructive">
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
