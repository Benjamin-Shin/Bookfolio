"use client";

import type { LibraryKind, LibrarySummary } from "@bookfolio/shared";
import { LIBRARY_KINDS } from "@bookfolio/shared";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LibraryCoverUploadField } from "@/components/libraries/library-cover-upload-field.client";
import { LIBRARY_KIND_LABELS } from "@/components/libraries/reading-status-labels";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type LibraryEditFormProps = {
  libraryId: string;
  initial: LibrarySummary;
  /** `page`(기본): 전체 폭 카드·돌아가기. `embedded`: 다이얼로그 본문 */
  variant?: "page" | "embedded";
  /** 저장 성공 시 호출. 지정되면 상세로 `router.push` 하지 않음 */
  onSaved?: () => void;
};

function isLibraryKind(v: string): v is LibraryKind {
  return (LIBRARY_KINDS as readonly string[]).includes(v);
}

/**
 * 모임서가 메타 수정 폼(PATCH `/api/me/libraries/:id`).
 *
 * @history
 * - 2026-05-04: `variant`·`onSaved` — 다이얼로그 내 편집
 * - 2026-05-04: 대표 이미지 — `LibraryCoverUploadField`(붙여넣기·파일·URL → Cloudinary `cover`)
 * - 2026-05-04: 신규 — 모바일 `SharedLibraryEditScreen`과 동일 필드
 */
export function LibraryEditForm({
  libraryId,
  initial,
  variant = "page",
  onSaved,
}: LibraryEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? "");
  const [kind, setKind] = useState<LibraryKind>(initial.kind);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      setError("이름을 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/me/libraries/${encodeURIComponent(libraryId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: n,
          description: description.trim() ? description.trim() : null,
          imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
          kind,
        }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          json &&
          typeof json === "object" &&
          "error" in json &&
          typeof (json as { error: unknown }).error === "string"
            ? (json as { error: string }).error
            : "저장하지 못했습니다.";
        setError(msg);
        return;
      }
      onSaved?.();
      if (!onSaved) {
        router.push(`/libraries/${libraryId}` as Route);
      }
      router.refresh();
    } catch {
      setError("네트워크 오류가 났습니다.");
    } finally {
      setBusy(false);
    }
  }

  const formClass =
    variant === "page"
      ? "mx-auto max-w-4xl space-y-6 rounded-2xl border border-[#1A3C2F]/10 bg-white p-6 shadow-sm md:p-8"
      : "space-y-6";

  return (
    <form onSubmit={(ev) => void onSubmit(ev)} className={formClass}>
      {variant === "page" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-xl font-semibold text-[#1A3C2F] md:text-2xl">
            모임서가 수정
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/libraries/${libraryId}` as Route}>돌아가기</Link>
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="lib-edit-name">이름</Label>
        <input
          id="lib-edit-name"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lib-edit-kind">종류</Label>
        <select
          id="lib-edit-kind"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
          value={kind}
          onChange={(e) => {
            const v = e.target.value;
            if (isLibraryKind(v)) setKind(v);
          }}
        >
          {LIBRARY_KINDS.map((k) => (
            <option key={k} value={k}>
              {LIBRARY_KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lib-edit-desc">설명</Label>
        <textarea
          id="lib-edit-desc"
          rows={4}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-[#1A3C2F]/10 bg-[#F8F9FA]/50 p-4">
        <LibraryCoverUploadField
          imageUrl={imageUrl}
          onImageUrlChange={setImageUrl}
          disabled={busy}
        />
      </div>

      <Button
        type="submit"
        className="bg-[#1A3C2F] hover:bg-[#1A3C2F]/90"
        disabled={busy}
      >
        {busy ? "저장 중…" : "저장"}
      </Button>
    </form>
  );
}
