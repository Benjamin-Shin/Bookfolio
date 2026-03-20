"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { deleteAdminCanonicalBook, type AdminBookActionState } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function DeleteSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={disabled || pending}>
      {pending ? "삭제 중…" : "삭제"}
    </Button>
  );
}

type AdminBookDeleteFormProps = {
  bookId: string;
  disabled: boolean;
};

export function AdminBookDeleteForm({ bookId, disabled }: AdminBookDeleteFormProps) {
  const [state, formAction] = useActionState(deleteAdminCanonicalBook, null as AdminBookActionState | null);

  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="bookId" value={bookId} />
      <DeleteSubmit disabled={disabled} />
      {state?.error ? (
        <Alert variant="destructive" className="max-w-xs py-2">
          <AlertTitle className="text-xs">삭제 불가</AlertTitle>
          <AlertDescription className="text-xs">{state.error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
