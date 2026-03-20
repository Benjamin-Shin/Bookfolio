"use client";

import { Settings2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AppProfileView } from "@/lib/auth/app-profiles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type HeaderAccountProps = {
  email: string;
  displayLabel: string;
  initialProfile: AppProfileView | null;
};

export function HeaderAccount({ email, displayLabel, initialProfile }: HeaderAccountProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(
    initialProfile?.displayName ?? displayLabel ?? ""
  );
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetFromProps() {
    setDisplayName(initialProfile?.displayName ?? displayLabel ?? "");
    setAvatarUrl(initialProfile?.avatarUrl ?? "");
    setError(null);
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      <span
        className="max-w-[10rem] truncate text-sm text-muted-foreground sm:max-w-[12rem]"
        title={email}
      >
        {displayLabel}
      </span>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) resetFromProps();
        }}
      >
        <DialogTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" aria-label="프로필 설정">
            <Settings2Icon className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>프로필</DialogTitle>
            <DialogDescription>표시 이름과 아바타 이미지 URL을 수정할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4 py-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              setError(null);
              try {
                const res = await fetch("/api/me/profile", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    displayName: displayName.trim() || null,
                    avatarUrl: avatarUrl.trim() || null
                  })
                });
                const data = (await res.json()) as { error?: string };
                if (!res.ok) {
                  setError(data.error ?? "저장에 실패했습니다.");
                  setSaving(false);
                  return;
                }
                setOpen(false);
                router.refresh();
              } catch {
                setError("네트워크 오류가 발생했습니다.");
              }
              setSaving(false);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="profile-email">이메일</Label>
              <Input id="profile-email" value={email} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-display">표시 이름</Label>
              <Input
                id="profile-display"
                value={displayName}
                onChange={(ev) => setDisplayName(ev.target.value)}
                placeholder="이름"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-avatar">아바타 URL (선택)</Label>
              <Input
                id="profile-avatar"
                value={avatarUrl}
                onChange={(ev) => setAvatarUrl(ev.target.value)}
                placeholder="https://…"
                type="url"
                inputMode="url"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "저장 중…" : "저장"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
