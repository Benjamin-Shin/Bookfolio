"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type CopyUserIdButtonProps = {
  userId: string;
};

/**
 * 관리자 사용자 표에서 UUID를 클립보드에 복사합니다.
 *
 * @history
 * - 2026-03-28: 초기 추가
 */
export function CopyUserIdButton({ userId }: CopyUserIdButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        setCopied(false);
        resetTimer.current = null;
      }, 2000);
    } catch {
      setCopied(false);
    }
  }, [userId]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={onCopy}
      aria-label={copied ? "복사됨" : "사용자 ID 복사"}
      title={copied ? "복사됨" : "사용자 ID 복사"}
    >
      {copied ? (
        <CheckIcon className="size-3.5 text-emerald-600" aria-hidden />
      ) : (
        <CopyIcon className="size-3.5" aria-hidden />
      )}
    </Button>
  );
}
