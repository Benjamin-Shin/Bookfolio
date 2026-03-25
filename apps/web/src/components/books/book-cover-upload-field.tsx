"use client";

/**
 * 도서 표지: 파일·클립보드·원격 URL을 `/api/upload`로 Cloudinary에 올리고 `coverUrl` hidden을 갱신합니다.
 *
 * @history
 * - 2026-03-25: `variant="edit"` — 미리보기 강조·비-Cloudinary 시 현재 URL로 이관 버튼
 * - 2026-03-25: 신규 — 신규/수정 폼 공통 필드
 */

import { useCallback, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isCloudinaryHostedCoverUrl } from "@/lib/books/cover-url";

export type BookCoverUploadVariant = "create" | "edit";

export interface BookCoverUploadFieldProps {
  coverUrl: string;
  onCoverUrlChange: (url: string) => void;
  disabled?: boolean;
  /** `edit`: 수정 페이지용 안내·비-Cloudinary 시 현재 URL 업로드 버튼 */
  variant?: BookCoverUploadVariant;
}

/** 서버 폼 등에서 초기값만 넘기고 내부 state로 `coverUrl` hidden을 유지할 때 사용합니다. */
export function BookCoverUploadFieldState({
  initialCoverUrl,
  variant = "create"
}: {
  initialCoverUrl: string;
  variant?: BookCoverUploadVariant;
}) {
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  return (
    <BookCoverUploadField coverUrl={coverUrl} onCoverUrlChange={setCoverUrl} variant={variant} />
  );
}

export function BookCoverUploadField({
  coverUrl,
  onCoverUrlChange,
  disabled,
  variant = "create"
}: BookCoverUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idBase = useId();

  const isEdit = variant === "edit";
  const hasCover = Boolean(coverUrl.trim());
  const onCloudinary = isCloudinaryHostedCoverUrl(coverUrl);

  const applyUploaded = useCallback(
    (url: string) => {
      onCoverUrlChange(url);
      setError(null);
    },
    [onCoverUrlChange]
  );

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      if (data.url) {
        applyUploaded(data.url);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFromImageUrl(raw: string) {
    const u = raw.trim();
    if (!u) {
      setError("이미지 주소를 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: u })
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      if (data.url) {
        applyUploaded(data.url);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    const files = e.clipboardData?.files;
    if (!files?.length) {
      return;
    }
    const img = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (img) {
      e.preventDefault();
      void uploadFile(img);
    }
  }

  const showMigrateCurrent = isEdit && hasCover && !onCloudinary;

  return (
    <div className="space-y-3">
      <input type="hidden" name="coverUrl" value={coverUrl} />

      <div className="space-y-1">
        <Label>표지 이미지</Label>
        <p className="text-xs text-muted-foreground">
          {isEdit ? (
            <>
              저장 시 공유 서지(`books`)의 표지 URL이 갱신됩니다. 아래에서 Cloudinary로 올리면 안정적인 배달 URL로
              바뀝니다.
            </>
          ) : (
            <>
              ISBN 검색으로 채운 표지가 있으면 그대로 쓰이며, 아래에서 파일·붙여넣기·URL로 Cloudinary에 올리면 공유
              서지 표지가 갱신됩니다.
            </>
          )}
        </p>
      </div>

      {hasCover ? (
        <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-4">
          <p className="text-sm font-medium text-foreground">표지 미리보기</p>
          <div className="flex justify-center">
            <img
              src={coverUrl}
              alt=""
              className="max-h-56 max-w-[11rem] rounded-md border border-border object-contain shadow-sm"
            />
          </div>
          {isEdit && onCloudinary ? (
            <p className="text-center text-xs text-muted-foreground">Cloudinary에 저장된 표지입니다.</p>
          ) : null}
          {isEdit && hasCover && !onCloudinary ? (
            <p className="text-center text-xs text-muted-foreground">
              아직 Cloudinary URL이 아닙니다. 같은 이미지를 Cloudinary로 옮기면 로딩·차단 이슈를 줄일 수 있습니다.
            </p>
          ) : null}
        </div>
      ) : isEdit ? (
        <p className="text-sm text-muted-foreground">등록된 표지 URL이 없습니다. 아래에서 이미지를 추가할 수 있습니다.</p>
      ) : null}

      {showMigrateCurrent ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">지금 보이는 표지 주소를 그대로 서버에서 받아 Cloudinary에 올립니다.</p>
          <Button
            type="button"
            variant="default"
            disabled={disabled || busy}
            className="shrink-0"
            onClick={() => void uploadFromImageUrl(coverUrl)}
          >
            {busy ? "업로드 중…" : "현재 표지 URL → Cloudinary 업로드"}
          </Button>
        </div>
      ) : null}

      <div className="space-y-3 rounded-lg border border-dashed border-border/80 bg-muted/10 p-4">
        {isEdit && onCloudinary ? (
          <p className="text-sm text-muted-foreground">다른 이미지로 바꾸려면 붙여넣기·파일·아래 URL 입력을 사용하세요.</p>
        ) : null}

        <div
          tabIndex={0}
          onPaste={onPaste}
          className="rounded-md border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          이 영역을 선택한 뒤 <span className="font-medium text-foreground">이미지 붙여넣기</span>(Ctrl+V)를 사용할 수
          있습니다.
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {busy ? "업로드 중…" : "파일에서 업로드"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled || busy}
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (f) {
                void uploadFile(f);
              }
              ev.target.value = "";
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idBase}-remote`}>{isEdit ? "다른 이미지 URL" : "표지 이미지 URL"}</Label>
          <p className="text-xs text-muted-foreground">
            임의의 http(s) 이미지 주소를 넣으면 서버가 받아 Cloudinary에 저장합니다.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <Input
              id={`${idBase}-remote`}
              value={remoteUrl}
              onChange={(ev) => setRemoteUrl(ev.target.value)}
              placeholder="https://…"
              disabled={disabled || busy}
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              disabled={disabled || busy}
              className="shrink-0"
              onClick={() => void uploadFromImageUrl(remoteUrl)}
            >
              URL에서 업로드
            </Button>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
