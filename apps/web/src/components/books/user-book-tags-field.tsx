"use client";

import { useCallback, useState } from "react";

import {
  USER_BOOK_TAG_MAX_COUNT,
  USER_BOOK_TAG_MAX_LENGTH,
  normalizeUserBookTags,
} from "@bookfolio/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type UserBookTagsFieldProps = {
  id?: string;
  name?: string;
  defaultTags?: string[];
  suggestions?: string[];
  /** 폼 POST용 hidden 값 갱신 */
  onTagsChange?: (tags: string[]) => void;
};

/**
 * 사용자 태그 입력(최대 5). 칩 + 텍스트 추가.
 *
 * @history
 * - 2026-05-24: `user_books.tags` — 책 등록·내 서가 기록 폼 공통
 */
export function UserBookTagsField({
  id = "user-book-tags",
  name = "tagsCsv",
  defaultTags = [],
  suggestions = [],
  onTagsChange,
}: UserBookTagsFieldProps) {
  const [tags, setTags] = useState<string[]>(() =>
    normalizeUserBookTags(defaultTags),
  );
  const [draft, setDraft] = useState("");

  const sync = useCallback(
    (next: string[]) => {
      const normalized = normalizeUserBookTags(next);
      setTags(normalized);
      onTagsChange?.(normalized);
    },
    [onTagsChange],
  );

  const addDraft = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    sync([...tags, trimmed]);
    setDraft("");
  }, [draft, sync, tags]);

  const removeTag = useCallback(
    (tag: string) => {
      sync(tags.filter((t) => t !== tag));
    },
    [sync, tags],
  );

  const canAdd = tags.length < USER_BOOK_TAG_MAX_COUNT;

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-input`}>태그 (선택, 최대 {USER_BOOK_TAG_MAX_COUNT}개)</Label>
      <p className="text-xs text-muted-foreground">
        내 서가에서 분류할 때 씁니다. 장르 통계와는 별개입니다. 태그당 최대{" "}
        {USER_BOOK_TAG_MAX_LENGTH}자.
      </p>
      <input type="hidden" name={name} value={tags.join(", ")} />
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                className="rounded-sm px-0.5 text-xs opacity-70 hover:opacity-100"
                aria-label={`${tag} 태그 제거`}
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      {canAdd ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id={`${id}-input`}
            value={draft}
            maxLength={USER_BOOK_TAG_MAX_LENGTH}
            placeholder="예: 업무, 재독"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDraft();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addDraft}>
            추가
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">태그는 최대 {USER_BOOK_TAG_MAX_COUNT}개까지입니다.</p>
      )}
      {suggestions.length > 0 && canAdd ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">최근:</span>
          {suggestions
            .filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()))
            .slice(0, 12)
            .map((s) => (
              <Button
                key={s}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => sync([...tags, s])}
              >
                {s}
              </Button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
