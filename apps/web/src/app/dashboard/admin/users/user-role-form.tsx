"use client";

import { useFormStatus } from "react-dom";

import { setUserRoleFromForm } from "@/app/dashboard/admin/actions";
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
  currentRole: "ADMIN" | "USER";
};

export function UserRoleForm({ userId, currentRole }: UserRoleFormProps) {
  return (
    <form action={setUserRoleFromForm} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <FormSelect name="role" defaultValue={currentRole} className="h-8 w-[7.5rem] text-xs" aria-label="권한">
        <option value="USER">USER</option>
        <option value="ADMIN">ADMIN</option>
      </FormSelect>
      <SubmitButton />
    </form>
  );
}
