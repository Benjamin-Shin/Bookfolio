"use client";

import type { LibraryMemberRow } from "@bookfolio/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = {
  libraryId: string;
  initialMembers: LibraryMemberRow[];
  currentUserId: string;
  isOwner: boolean;
};

/**
 * 공동서재 멤버 목록·초대·제거·소유권 이전.
 *
 * @history
 * - 2026-03-26: 소유자용 소유권 이전(멤버 선택 → `POST .../transfer-ownership`)
 */
export function LibraryMembersPanel({ libraryId, initialMembers, currentUserId, isOwner }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteFormMounted, setInviteFormMounted] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    setInviteFormMounted(true);
  }, []);

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

  async function handleTransferOwnership(e: React.FormEvent) {
    e.preventDefault();
    if (!transferTargetId) return;
    if (
      !confirm(
        "소유권을 이전하면 더 이상 이 서재의 소유자가 아닙니다(멤버로 남습니다). 계속할까요?"
      )
    ) {
      return;
    }
    setError(null);
    setTransferLoading(true);
    try {
      const res = await fetch(`/api/me/libraries/${libraryId}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOwnerUserId: transferTargetId })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "소유권을 이전하지 못했습니다.");
        return;
      }
      setTransferTargetId("");
      await refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setTransferLoading(false);
    }
  }

  const transferCandidates = members.filter((m) => m.role === "member");

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
      {isOwner && transferCandidates.length > 0 ? (
        <form
          className="space-y-2 rounded-md border border-border/80 p-3"
          onSubmit={(e) => void handleTransferOwnership(e)}
        >
          <p className="text-sm font-medium">소유권 이전</p>
          <p className="text-xs text-muted-foreground">
            다른 멤버에게 소유자 권한을 넘깁니다. 회원 탈퇴 전에는 반드시 처리해야 할 수 있습니다.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="transfer-owner">새 소유자</Label>
              <select
                id="transfer-owner"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={transferTargetId}
                onChange={(ev) => setTransferTargetId(ev.target.value)}
              >
                <option value="">멤버 선택…</option>
                {transferCandidates.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name?.trim() || m.email}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary" disabled={transferLoading || !transferTargetId}>
              {transferLoading ? "처리 중…" : "이전"}
            </Button>
          </div>
        </form>
      ) : null}
      {isOwner ? (
        inviteFormMounted ? (
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
        ) : (
          <div
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
            aria-busy="true"
            aria-label="초대 폼 로드 중"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-4 w-48 max-w-full rounded bg-muted/60" />
              <div className="h-9 w-full rounded-md bg-muted/60" />
            </div>
            <div className="h-9 w-[4.5rem] shrink-0 rounded-md bg-muted/60 sm:mb-0" />
          </div>
        )
      ) : null}
      <p className="text-xs text-muted-foreground">
        이미 Bookfolio에 가입한 이메일만 추가할 수 있습니다. 가족·모임 서재는 같은 데이터 구조를 사용합니다.
      </p>
    </div>
  );
}
