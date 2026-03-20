"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  libraryId: string;
};

export function DeleteLibraryButton({ libraryId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("이 공동서재와 안의 모든 책·기록을 삭제할까요? 되돌릴 수 없습니다.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/me/libraries/${libraryId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "삭제하지 못했습니다.");
        return;
      }
      router.push("/dashboard/libraries" as Route);
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="destructive" size="sm" disabled={loading} onClick={() => void handleDelete()}>
      {loading ? "삭제 중…" : "서재 삭제"}
    </Button>
  );
}
