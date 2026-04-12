"use client";

import type { LibraryMemberRow } from "@bookfolio/shared";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Props = {
  libraryId: string;
  initialMembers: LibraryMemberRow[];
  currentUserId: string;
  isOwner: boolean;
};

function MemberAvatar({ member }: { member: LibraryMemberRow }) {
  const label = member.name?.trim() || "이름 없음";
  const src = member.image?.trim();
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="size-9 shrink-0 rounded-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1a3021]/10 text-xs font-semibold text-[#051b0e]"
      aria-hidden
    >
      {label.slice(0, 1).toUpperCase()}
    </div>
  );
}

/**
 * 공동서재 좌측 — 멤버 목록(이메일 비표시)·소유자 초대·관리 다이얼로그.
 *
 * @history
 * - 2026-04-12: `LibraryMembersPanel` 대체 — 아바타·이름 우선, 초대는 팝업
 */
export function LibraryMembersSidebar({ libraryId, initialMembers, currentUserId, isOwner }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [inviteFormMounted, setInviteFormMounted] = useState(false);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

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
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "추가하지 못했습니다.");
        return;
      }
      setEmail("");
      setInviteOpen(false);
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
        method: "DELETE",
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
        body: JSON.stringify({ newOwnerUserId: transferTargetId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "소유권을 이전하지 못했습니다.");
        return;
      }
      setTransferTargetId("");
      setInviteOpen(false);
      await refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setTransferLoading(false);
    }
  }

  const transferCandidates = members.filter((m) => m.role === "member");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-sans text-[0.75rem] font-bold uppercase tracking-widest text-[#051b0e]">
          Members
        </h3>
        {isOwner ? (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 border-[#051b0e]/20 text-[0.65rem] uppercase tracking-widest"
              >
                <UserPlus className="mr-1 size-3.5" aria-hidden />
                초대
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md border-[#051b0e]/10">
              <DialogHeader>
                <DialogTitle className="font-serif text-[#051b0e]">멤버 초대</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-1">
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                {inviteFormMounted ? (
                  <form className="space-y-3" onSubmit={(e) => void handleAdd(e)}>
                    <div className="space-y-1">
                      <Label htmlFor="lib-invite-email">가입 이메일</Label>
                      <input
                        id="lib-invite-email"
                        type="email"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="friend@example.com"
                        autoComplete="email"
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-[#1a3021] hover:bg-[#1a3021]/90">
                      {loading ? "추가 중…" : "초대 보내기"}
                    </Button>
                  </form>
                ) : null}
                {isOwner && transferCandidates.length > 0 ? (
                  <form
                    className="space-y-2 border-t border-border/60 pt-4"
                    onSubmit={(e) => void handleTransferOwnership(e)}
                  >
                    <p className="text-sm font-medium text-[#051b0e]">소유권 이전</p>
                    <p className="text-xs text-muted-foreground">
                      다른 멤버에게 소유자 권한을 넘깁니다. 탈퇴 전 처리가 필요할 수 있습니다.
                    </p>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={transferTargetId}
                      onChange={(ev) => setTransferTargetId(ev.target.value)}
                      aria-label="새 소유자"
                    >
                      <option value="">멤버 선택…</option>
                      {transferCandidates.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.name?.trim() || "이름 없음"}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="secondary" disabled={transferLoading || !transferTargetId}>
                      {transferLoading ? "처리 중…" : "소유권 이전"}
                    </Button>
                  </form>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  이미 서가담에 가입한 이메일만 추가할 수 있습니다.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {error && !inviteOpen ? <p className="text-xs text-destructive">{error}</p> : null}

      <ul className="space-y-2">
        {members.map((m) => {
          const name = m.name?.trim() || "이름 없음";
          return (
            <li
              key={m.userId}
              className="flex items-center gap-2 rounded-md border border-[#051b0e]/10 bg-white/40 px-2 py-2"
            >
              <MemberAvatar member={m} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#051b0e]">{name}</p>
                <p className="text-[0.65rem] uppercase tracking-wider text-[#1a3021]/50">
                  {m.role === "owner" ? "소유자" : "멤버"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                {m.userId === currentUserId && m.role !== "owner" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => void handleRemove(m.userId)}
                  >
                    나가기
                  </Button>
                ) : null}
                {isOwner && m.role !== "owner" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => void handleRemove(m.userId)}
                  >
                    제거
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
