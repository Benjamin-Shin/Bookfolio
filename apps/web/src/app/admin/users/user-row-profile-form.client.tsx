"use client";

import { useFormStatus } from "react-dom";

import { saveUserDisplayNameAndRoleFromForm } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/form-select";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? "저장 중…" : "저장"}
    </Button>
  );
}

type UserRowProfileFormProps = {
  userId: string;
  initialName: string | null;
  currentRole: "ADMIN" | "STAFF" | "USER";
};

/**
 * 관리자 사용자 행 — 표시명·권한을 한 번에 저장합니다.
 *
 * @history
 * - 2026-05-04: 신규 — `UserNameForm`·`UserRoleForm` 통합
 */
export function UserRowProfileForm({
  userId,
  initialName,
  currentRole,
}: UserRowProfileFormProps) {
  return (
    <form
      action={saveUserDisplayNameAndRoleFromForm}
      className="flex min-w-[18rem] max-w-[28rem] flex-wrap items-center gap-2"
    >
      <input type="hidden" name="userId" value={userId} />
      <Input
        name="displayName"
        type="text"
        defaultValue={initialName ?? ""}
        maxLength={200}
        className="h-8 min-w-[7rem] flex-1 text-xs"
        aria-label="이름"
        autoComplete="off"
      />
      <FormSelect
        name="role"
        defaultValue={currentRole}
        className="h-8 w-[9.5rem] py-0 pl-2 pr-8 text-xs leading-8"
        aria-label="권한"
      >
        <option value="USER">USER</option>
        <option value="STAFF">STAFF</option>
        <option value="ADMIN">ADMIN</option>
      </FormSelect>
      <SubmitButton />
    </form>
  );
}
