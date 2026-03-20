"use client";

import type { LibraryMemberRow } from "@bookfolio/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = {
  libraryId: string;
  initialMembers: LibraryMemberRow[];
  currentUserId: string;
  isOwner: boolean;
};

export function LibraryMembersPanel({ libraryId, initialMembers, currentUserId, isOwner }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch(`/api/me/libraries/${libraryId}/members`);
    if (res.ok) {
      const data = (await res.json()) as LibraryMemberRow[];
      setMembers(data);
    }
    router.refresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/me/libraries/${libraryId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "추가하지 못했습니다.");
        return;
      }
      setEmail("");
      await refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(targetUserId: string) {
    if (!confirm("이 멤버를 서재에서 제거할까요?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/me/libraries/${libraryId}/members/${targetUserId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "제거하지 못했습니다.");
        return;
      }
      await refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <ul className="divide-y rounded-md border border-border/80 text-sm">
        {members.map((m) => (
          <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
            <div>
              <span className="font-medium">{m.name?.trim() || m.email}</span>
              {m.name?.trim() ? <span className="ml-2 text-muted-foreground">{m.email}</span> : null}
              <span className="ml-2 text-xs text-muted-foreground">
                {m.role === "owner" ? "소유자" : "멤버"}
              </span>
            </div>
            <div className="flex gap-2">
              {m.userId === currentUserId && m.role !== "owner" ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => void handleRemove(m.userId)}>
                  나가기
                </Button>
              ) : null}
              {isOwner && m.role !== "owner" ? (
                <Button type="button" variant="outline" size="sm" onClick={() => void handleRemove(m.userId)}>
                  제거
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {isOwner ? (
        <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(e) => void handleAdd(e)}>
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="invite-email">멤버 초대 (가입 이메일)</Label>
            <input
              id="invite-email"
              type="email"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              autoComplete="email"
            />
          </div>
          <Button type="submit" disabled={loading} variant="secondary">
            {loading ? "추가 중…" : "초대"}
          </Button>
        </form>
      ) : null}
      <p className="text-xs text-muted-foreground">
        이미 Bookfolio에 가입한 이메일만 추가할 수 있습니다. 가족·모임 서재는 같은 데이터 구조를 사용합니다.
      </p>
    </div>
  );
}
