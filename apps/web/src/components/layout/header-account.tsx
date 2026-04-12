"use client";

import { Settings2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

import type { AppProfileView } from "@/lib/auth/app-profiles";
import { normalizeCoverUrlForClient } from "@/lib/books/cover-url";
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
import { ProfileAvatarUploadField } from "@/components/layout/profile-avatar-upload-field";

type HeaderAccountProps = {
  email: string;
  displayLabel: string;
  initialProfile: AppProfileView | null;
  /** 소유 공동서재에 다른 멤버가 있어 서버 탈퇴가 거절되는 서재 이름 (`listOwnedSharedLibrariesBlockingWithdrawal`) */
  sharedLibrariesBlockingWithdrawal?: string[];
};

/**
 * 헤더 오른쪽 계정 표시·프로필 편집 다이얼로그.
 *
 * @history
 * - 2026-03-26: 탈퇴 안내 — 공동서재 소유권 이전·단독 소유 시 CASCADE 정리 문구
 * - 2026-03-26: 프로필 다이얼로그 1행에 이메일·표시 이름(2열), 2행에 `ProfileAvatarUploadField`(내부 2열)
 * - 2026-03-26: 표시 이름 왼쪽에 아바타 썸네일·저장 응답·서버 props 동기화
 * - 2026-03-26: 아바타 — `ProfileAvatarUploadField`(Cloudinary `/api/upload` kind `avatar`)
 * - 2026-04-02: 인구통계(성별·생년월일·공개 동의), 프로필 저장 `POST /api/me/profile`
 * - 2026-03-26: 회원 탈퇴 확인 후 `DELETE /api/me/account`·`signOut`
 * - 2026-03-29: 프로필 하단 푸터 한 줄에 탈퇴(좌·destructive)·취소·저장, 안내 문구는 그 아래
 * - 2026-03-29: 소유 공동·모임 서재에 타 멤버 있으면 탈퇴 버튼 비활성·안내
 */
export function HeaderAccount({
  email,
  displayLabel,
  initialProfile,
  sharedLibrariesBlockingWithdrawal = []
}: HeaderAccountProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(
    initialProfile?.displayName ?? displayLabel ?? ""
  );
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl ?? "");
  const [gender, setGender] = useState(initialProfile?.gender ?? "");
  const [birthDate, setBirthDate] = useState(
    initialProfile?.birthDate ? initialProfile.birthDate.slice(0, 10) : ""
  );
  const [genderPublic, setGenderPublic] = useState(initialProfile?.genderPublic ?? false);
  const [birthDatePublic, setBirthDatePublic] = useState(initialProfile?.birthDatePublic ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetFromProps() {
    setDisplayName(initialProfile?.displayName ?? displayLabel ?? "");
    setAvatarUrl(initialProfile?.avatarUrl ?? "");
    setGender(initialProfile?.gender ?? "");
    setBirthDate(initialProfile?.birthDate ? initialProfile.birthDate.slice(0, 10) : "");
    setGenderPublic(initialProfile?.genderPublic ?? false);
    setBirthDatePublic(initialProfile?.birthDatePublic ?? false);
    setError(null);
  }

  useEffect(() => {
    setDisplayName(initialProfile?.displayName ?? displayLabel ?? "");
    setAvatarUrl(initialProfile?.avatarUrl ?? "");
    setGender(initialProfile?.gender ?? "");
    setBirthDate(initialProfile?.birthDate ? initialProfile.birthDate.slice(0, 10) : "");
    setGenderPublic(initialProfile?.genderPublic ?? false);
    setBirthDatePublic(initialProfile?.birthDatePublic ?? false);
  }, [
    initialProfile?.avatarUrl,
    initialProfile?.birthDate,
    initialProfile?.birthDatePublic,
    initialProfile?.displayName,
    initialProfile?.gender,
    initialProfile?.genderPublic,
    displayLabel
  ]);

  const headerAvatarSrc = normalizeCoverUrlForClient(avatarUrl || null);
  const withdrawalBlockedByOwnedSharedLibs = sharedLibrariesBlockingWithdrawal.length > 0;

  return (
    <div className="flex min-w-0 items-center gap-2">
      {headerAvatarSrc ? (
        <img
          src={headerAvatarSrc}
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 rounded-full border border-border/80 bg-muted object-cover"
        />
      ) : null}
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
        <DialogContent className="gap-0 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>프로필</DialogTitle>
            <DialogDescription>
              표시 이름과 아바타를 수정할 수 있습니다. 아바타는 이미지 파일·붙여넣기·URL로 Cloudinary에 올리거나 주소를
              직접 입력할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4 py-2 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              setError(null);
              try {
                const res = await fetch("/api/me/profile", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "update",
                    displayName: displayName.trim() || null,
                    avatarUrl: avatarUrl.trim() || null,
                    gender: gender.trim() || null,
                    birthDate: birthDate.trim() || null,
                    genderPublic,
                    birthDatePublic
                  })
                });
                const data = (await res.json()) as AppProfileView & { error?: string };
                if (!res.ok) {
                  setError(data.error ?? "저장에 실패했습니다.");
                  setSaving(false);
                  return;
                }
                setAvatarUrl(data.avatarUrl ?? "");
                setDisplayName(data.displayName ?? displayLabel ?? "");
                setGender(data.gender ?? "");
                setBirthDate(data.birthDate ? data.birthDate.slice(0, 10) : "");
                setGenderPublic(data.genderPublic ?? false);
                setBirthDatePublic(data.birthDatePublic ?? false);
                setOpen(false);
                router.refresh();
              } catch {
                setError("네트워크 오류가 발생했습니다.");
              }
              setSaving(false);
            }}
          >
            <div className="min-w-0 space-y-2">
              <Label htmlFor="profile-email">이메일</Label>
              <Input id="profile-email" value={email} readOnly className="bg-muted/50" />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="profile-display">표시 이름</Label>
              <Input
                id="profile-display"
                value={displayName}
                onChange={(ev) => setDisplayName(ev.target.value)}
                placeholder="이름"
                autoComplete="name"
              />
            </div>
            <div className="min-w-0 border-t border-border/60 pt-4 sm:col-span-2 sm:border-t sm:pt-4">
              <ProfileAvatarUploadField
                avatarUrl={avatarUrl}
                onAvatarUrlChange={setAvatarUrl}
                disabled={saving}
              />
            </div>
            <div className="min-w-0 space-y-2 sm:col-span-2">
              <Label htmlFor="profile-gender">성별 (선택)</Label>
              <select
                id="profile-gender"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={gender}
                onChange={(ev) => setGender(ev.target.value)}
                disabled={saving}
              >
                <option value="">선택 안 함</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
                <option value="unknown">비공개</option>
              </select>
            </div>
            <div className="min-w-0 space-y-2 sm:col-span-2">
              <Label htmlFor="profile-birth">생년월일 (선택)</Label>
              <Input
                id="profile-birth"
                type="date"
                value={birthDate}
                onChange={(ev) => setBirthDate(ev.target.value)}
                disabled={saving}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={genderPublic}
                onChange={(ev) => setGenderPublic(ev.target.checked)}
                disabled={saving}
              />
              성별을 익명 통계에 포함
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={birthDatePublic}
                onChange={(ev) => setBirthDatePublic(ev.target.checked)}
                disabled={saving}
              />
              생년(출생 연도)을 익명 통계에 포함
            </label>
            {error ? (
              <p className="text-sm text-destructive sm:col-span-2">{error}</p>
            ) : null}
            <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:col-span-2">
              <div className="flex flex-row flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  className="shrink-0"
                  disabled={withdrawalBlockedByOwnedSharedLibs}
                  title={
                    withdrawalBlockedByOwnedSharedLibs
                      ? "소유 중인 공동·모임 서재를 정리한 뒤 탈퇴할 수 있습니다."
                      : undefined
                  }
                  onClick={() => {
                    if (withdrawalBlockedByOwnedSharedLibs) return;
                    setDeleteError(null);
                    setDeleteOpen(true);
                  }}
                >
                  회원 탈퇴
                </Button>
                <div className="flex shrink-0 flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    취소
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "저장 중…" : "저장"}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">계정을 삭제하면 데이터가 모두 사라집니다.</p>
              {withdrawalBlockedByOwnedSharedLibs ? (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
                  <span className="font-medium">소유 중인 공동·모임 서재</span>에 다른 멤버가 있어 지금은 탈퇴할 수
                  없습니다.{" "}
                  <span className="whitespace-normal break-words">
                    해당 서재 설정에서 소유권을 다른 멤버에게 이전한 뒤 다시 시도해 주세요.
                    {sharedLibrariesBlockingWithdrawal.length > 0 ? (
                      <>
                        {" "}
                        <span className="text-muted-foreground">(해당 서재: </span>
                        {sharedLibrariesBlockingWithdrawal.join(", ")}
                        <span className="text-muted-foreground">)</span>
                      </>
                    ) : null}
                  </span>
                </p>
              ) : null}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md gap-4">
          <DialogHeader>
            <DialogTitle>회원 탈퇴</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">탈퇴를 확인하면</span> 아래 정보가{" "}
                  <strong className="text-foreground">물리적으로 삭제</strong>되며 복구할 수 없습니다.
                </p>
                <ul className="list-inside list-disc space-y-1 text-foreground/90">
                  <li>보유 포인트 및 포인트 원장 전체</li>
                  <li>내 서재(소장 도서), 메모, 독서 이벤트 기록, 한줄평</li>
                  <li>내가 만든 공동서재 — 다른 멤버가 없으면 탈퇴와 함께 삭제되고, 있으면 탈퇴 전 소유권 이전 필요</li>
                  <li>다른 사람 서재에 참여 중이던 멤버십</li>
                  <li>프로필·계정(로그인) 정보</li>
                </ul>
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
                  <strong>소유한 공동서재</strong>에 다른 멤버가 있으면 탈퇴할 수 없습니다. 해당 서재 화면에서{" "}
                  <strong>소유권을 다른 멤버에게 이전</strong>한 뒤 탈퇴해 주세요. 본인만 남은 공동서재는 별도
                  삭제 없이 탈퇴 시 함께 정리됩니다.
                </p>
                <p className="text-xs">
                  여러 사용자가 쓰는 공유 서지(<code className="rounded bg-muted px-1">books</code>)는 삭제되지
                  않을 수 있습니다.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteLoading}
              onClick={async () => {
                setDeleteLoading(true);
                setDeleteError(null);
                try {
                  const res = await fetch("/api/me/account", { method: "DELETE" });
                  const data = (await res.json()) as { error?: string };
                  if (!res.ok) {
                    setDeleteError(
                      data.error ?? (res.status === 409 ? "탈퇴 전 공동서재를 정리해 주세요." : "탈퇴에 실패했습니다.")
                    );
                    return;
                  }
                  setDeleteOpen(false);
                  setOpen(false);
                  await signOut({ callbackUrl: "/" });
                } catch {
                  setDeleteError("네트워크 오류가 발생했습니다.");
                } finally {
                  setDeleteLoading(false);
                }
              }}
            >
              {deleteLoading ? "처리 중…" : "탈퇴 확인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
