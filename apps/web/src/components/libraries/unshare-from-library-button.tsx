"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  libraryId: string;
  bookId: string;
};

export function UnshareFromLibraryButton({ libraryId, bookId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUnshare() {
    if (
      !window.confirm(
        "이 서가에서 내 책만 빼시겠어요? 개인 서가에는 그대로 남습니다.",
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/me/libraries/${libraryId}/books/${bookId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        window.alert(data.error ?? "처리하지 못했습니다.");
        return;
      }
      router.push(`/dashboard/libraries/${libraryId}` as Route);
      router.refresh();
    } catch {
      window.alert("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={() => void handleUnshare()}
    >
      {loading ? "처리 중…" : "이 서가에서 내 책 빼기"}
    </Button>
  );
}
