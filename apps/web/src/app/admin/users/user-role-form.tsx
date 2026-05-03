"use client";

import { useFormStatus } from "react-dom";

import { setUserRoleFromForm } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? "저장 중…" : "저장"}
    </Button>
  );
}

type UserRoleFormProps = {
  userId: string;
  currentRole: "ADMIN" | "STAFF" | "USER";
};

/**
 * 관리자 사용자 표에서 `app_users.role`을 변경합니다.
 *
 * @history
 * - 2026-05-03: `FormSelect` 기본 `py-2`와 `h-8` 충돌로 글자 잘림 방지(`py-0`·`leading-8`)
 * - 2026-05-03: 권한 `<select>` 너비 `7.5rem` → `9.5rem`
 */
export function UserRoleForm({ userId, currentRole }: UserRoleFormProps) {
  return (
    <form
      action={setUserRoleFromForm}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="userId" value={userId} />
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
