"use client";

import { READING_STATUSES, type ReadingStatus } from "@bookfolio/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { READING_STATUS_LABELS } from "@/components/libraries/reading-status-labels";

type Props = {
  libraryId: string;
  /** `books.id` (카탈로그 도서 ID) */
  bookId: string;
  initialStatus: ReadingStatus;
};

export function MyLibraryBookReadingForm({ libraryId, bookId, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ReadingStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/me/libraries/${libraryId}/books/${bookId}/my-state`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readingStatus: status })
        }
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "저장하지 못했습니다.");
        return;
      }
      setMessage("저장했습니다.");
      router.refresh();
    } catch {
      setMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label htmlFor="my-reading" className="text-sm font-medium">
          내 읽기 상태
        </label>
        <select
          id="my-reading"
          className="flex h-9 min-w-[10rem] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as ReadingStatus)}
        >
          {READING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {READING_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <Button type="button" size="sm" disabled={loading} onClick={() => void handleSave()}>
        {loading ? "저장 중…" : "저장"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
