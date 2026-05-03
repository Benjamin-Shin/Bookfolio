"use client";

import { useCallback, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isCloudinaryHostedCoverUrl, normalizeCoverUrlForClient } from "@/lib/books/cover-url";

export interface LibraryCoverUploadFieldProps {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  disabled?: boolean;
}

/**
 * 모임서가 대표 이미지: 파일·클립보드·원격 URL을 `/api/upload`(kind `cover`)로 Cloudinary에 올리고 URL을 갱신합니다.
 * (`ProfileAvatarUploadField`와 동일 패턴, 폴더·변환은 `bookfolio-covers`.)
 *
 * @history
 * - 2026-05-04: 미리보기 `src`에 `normalizeCoverUrlForClient` 적용
 * - 2026-05-04: 신규 — 모임서가 수정 화면용
 */
export function LibraryCoverUploadField({
  imageUrl,
  onImageUrlChange,
  disabled,
}: LibraryCoverUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const idBase = useId();

  const hasImage = Boolean(imageUrl.trim());
  const onCloudinary = isCloudinaryHostedCoverUrl(imageUrl);

  const applyUploaded = useCallback(
    (url: string) => {
      onImageUrlChange(url);
      setLocalError(null);
    },
    [onImageUrlChange],
  );

  async function uploadFileToCloudinary(file: File) {
    if (!file.type.startsWith("image/")) {
      setLocalError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLocalError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }
    setBusy(true);
    setLocalError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "cover");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setLocalError(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      if (data.url) {
        applyUploaded(data.url);
      }
    } catch {
      setLocalError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFromImageUrl(raw: string) {
    const u = raw.trim();
    if (!u) {
      setLocalError("이미지 주소를 입력해 주세요.");
      return;
    }
    setBusy(true);
    setLocalError(null);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: u, kind: "cover" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setLocalError(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      if (data.url) {
        applyUploaded(data.url);
      }
    } catch {
      setLocalError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    const files = e.clipboardData?.files;
    if (files?.length) {
      const img = Array.from(files).find((f) => f.type.startsWith("image/"));
      if (img) {
        e.preventDefault();
        void uploadFileToCloudinary(img);
        return;
      }
    }
    const text = e.clipboardData?.getData("text/plain")?.trim() ?? "";
    if (!text) return;
    try {
      const u = new URL(text);
      if (u.protocol === "http:" || u.protocol === "https:") {
        e.preventDefault();
        setRemoteUrl(text);
        void uploadFromImageUrl(text);
      }
    } catch {
      /* not a URL */
    }
  }

  const showMigrateCurrent = hasImage && !onCloudinary;
  const effectiveDisabled = disabled || busy;

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:items-start sm:gap-x-6">
      <div className="min-w-0 space-y-3">
        <div className="space-y-1">
          <Label>대표 이미지</Label>
          <p className="text-xs text-muted-foreground">
            오른쪽에서 파일·붙여넣기·URL 업로드로 Cloudinary(
            <span className="font-medium">bookfolio-covers</span>)에 올립니다. 외부 주소만 저장하려면 URL 업로드로 서버에서
            받아 저장하는 것을 권장합니다.
          </p>
        </div>

        {hasImage ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border/80 bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">미리보기</p>
            <img
              src={normalizeCoverUrlForClient(imageUrl) ?? imageUrl}
              alt=""
              className="aspect-[4/3] w-full max-w-[240px] rounded-2xl border border-border object-cover shadow-sm"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {onCloudinary ? (
              <p className="text-center text-xs text-muted-foreground">Cloudinary에 저장된 이미지입니다.</p>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                Cloudinary URL이 아닙니다. 같은 이미지를 서버에서 받아 올리면 로딩·차단 이슈를 줄일 수 있습니다.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">대표 이미지가 없습니다. 오른쪽에서 추가할 수 있습니다.</p>
        )}

        {showMigrateCurrent ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">지금 주소의 이미지를 그대로 Cloudinary에 올립니다.</p>
            <Button
              type="button"
              variant="default"
              disabled={effectiveDisabled}
              className="w-full shrink-0 sm:w-auto"
              onClick={() => void uploadFromImageUrl(imageUrl)}
            >
              {busy ? "업로드 중…" : "현재 URL → Cloudinary 업로드"}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="min-w-0 space-y-3">
        <div className="space-y-3 rounded-lg border border-dashed border-border/80 bg-muted/10 p-4">
          {onCloudinary && hasImage ? (
            <p className="text-sm text-muted-foreground">
              다른 이미지로 바꾸려면 붙여넣기·파일·아래 URL 입력을 사용하세요.
            </p>
          ) : null}

          <div
            tabIndex={0}
            onPaste={onPaste}
            className="rounded-md border border-dashed border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            이 영역을 선택한 뒤 붙여넣기(Ctrl+V):{" "}
            <span className="font-medium text-foreground">클립보드 이미지</span> 또는{" "}
            <span className="font-medium text-foreground">http(s) 이미지 URL 문자열</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={effectiveDisabled}
              onClick={() => fileInputRef.current?.click()}
            >
              {busy ? "업로드 중…" : "파일에서 업로드"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={effectiveDisabled}
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                if (f) {
                  void uploadFileToCloudinary(f);
                }
                ev.target.value = "";
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idBase}-remote`}>이미지 URL에서 Cloudinary로 업로드</Label>
            <p className="text-xs text-muted-foreground">
              http(s) 이미지 주소를 넣으면 서버가 받아 Cloudinary에 저장합니다.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Input
                id={`${idBase}-remote`}
                value={remoteUrl}
                onChange={(ev) => setRemoteUrl(ev.target.value)}
                placeholder="https://…"
                disabled={effectiveDisabled}
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                disabled={effectiveDisabled}
                className="shrink-0"
                onClick={() => void uploadFromImageUrl(remoteUrl)}
              >
                URL에서 업로드
              </Button>
            </div>
          </div>
        </div>
      </div>

      {localError ? (
        <p className="text-sm text-destructive sm:col-span-2">{localError}</p>
      ) : null}
    </div>
  );
}
