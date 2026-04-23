"use client";

import { LIBRARY_KINDS } from "@bookfolio/shared";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LIBRARY_KIND_LABELS } from "@/components/libraries/reading-status-labels";

export type NewLibraryFormProps = {
  canCreateMore: boolean;
  createLimit: number;
  createdCount: number;
};

/**
 * @history
 * - 2026-03-25: `canCreateMore`·상한 안내 — `policies_json.sharedLibraryCreateLimit`
 */
export function NewLibraryForm({
  canCreateMore,
  createLimit,
  createdCount,
}: NewLibraryFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<(typeof LIBRARY_KINDS)[number]>("family");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/me/libraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          kind,
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "만들 수 없습니다.");
        if (res.status === 403) {
          router.refresh();
        }
        return;
      }
      if (data.id) {
        router.push(`/dashboard/libraries/${data.id}` as Route);
        router.refresh();
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)}>
      {!canCreateMore ? (
        <Alert variant="destructive">
          <AlertTitle>새 공동서가를 더 만들 수 없습니다</AlertTitle>
          <AlertDescription>
            회원 정책상 소유 공동서가는 최대 {createLimit}개입니다. (현재{" "}
            {createdCount}개)
          </AlertDescription>
        </Alert>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="lib-name">이름</Label>
        <Input
          id="lib-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={!canCreateMore}
          placeholder="예: 우리 집 책장"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lib-kind">종류</Label>
        <select
          id="lib-kind"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          value={kind}
          disabled={!canCreateMore}
          onChange={(e) =>
            setKind(e.target.value as (typeof LIBRARY_KINDS)[number])
          }
        >
          {LIBRARY_KINDS.map((k) => (
            <option key={k} value={k}>
              {LIBRARY_KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="lib-desc">설명 (선택)</Label>
        <Textarea
          id="lib-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={!canCreateMore}
          placeholder="이 서가를 어떻게 쓸지 적어 두세요."
        />
      </div>
      <Button type="submit" disabled={loading || !canCreateMore}>
        {loading ? "만드는 중…" : "공동서가 만들기"}
      </Button>
    </form>
  );
}
