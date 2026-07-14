"use client";

import {
  USER_FEEDBACK_CATEGORIES,
  USER_FEEDBACK_CATEGORY_LABEL_KO,
  type UserFeedbackCategory,
} from "@bookfolio/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type UserFeedbackFormProps = {
  defaultContactEmail?: string | null;
};

/**
 * 의견 보내기 폼 — `POST /api/me/feedback`.
 *
 * @history
 * - 2026-06-10: 유형 선택 — select 대신 버튼(칩) 방식
 * - 2026-05-18: 신규
 */
export function UserFeedbackForm({ defaultContactEmail }: UserFeedbackFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState<UserFeedbackCategory>("other");
  const [body, setBody] = useState("");
  const [contactEmail, setContactEmail] = useState(defaultContactEmail?.trim() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const shellClass =
    "space-y-5 rounded-2xl border border-[#E9E3DE] bg-white p-4 shadow-sm sm:p-6";

  if (done) {
    return (
      <div className={shellClass}>
        <p className="font-medium text-[#1A3C2F]">의견을 보냈습니다. 감사합니다.</p>
        <p className="mt-2 text-sm text-[#434843]">
          검토 후 필요하면 연락 이메일로 답변드릴 수 있습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
            내 서가로
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDone(false);
              setBody("");
              setError(null);
            }}
          >
            추가로 보내기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className={shellClass}
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
          const res = await fetch("/api/me/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category,
              body: body.trim(),
              contactEmail: contactEmail.trim() || null,
              platform: "web",
              deviceInfo: {
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
              },
            }),
          });
          const data = (await res.json()) as { error?: string };
          if (!res.ok) {
            setError(data.error ?? "전송에 실패했습니다.");
            return;
          }
          setDone(true);
          router.refresh();
        } catch {
          setError("네트워크 오류가 발생했습니다.");
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label>유형</Label>
        <div className="flex flex-wrap gap-2">
          {USER_FEEDBACK_CATEGORIES.map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={category === c ? "default" : "outline"}
              className={
                category === c ? "bg-[#0E6A3C] text-white hover:bg-[#0E6A3C]/90" : undefined
              }
              onClick={() => setCategory(c)}
              disabled={saving}
            >
              {USER_FEEDBACK_CATEGORY_LABEL_KO[c]}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-body">의견</Label>
        <Textarea
          id="feedback-body"
          value={body}
          onChange={(ev) => setBody(ev.target.value)}
          placeholder="불편했던 점, 개선 아이디어, 오류 상황 등"
          rows={8}
          required
          minLength={4}
          maxLength={4000}
          disabled={saving}
        />
        <p className="text-xs text-muted-foreground">{body.length} / 4000</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-email">회신 이메일 (선택)</Label>
        <input
          id="feedback-email"
          type="email"
          className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={contactEmail}
          onChange={(ev) => setContactEmail(ev.target.value)}
          placeholder="답변이 필요할 때만 입력"
          autoComplete="email"
          disabled={saving}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="submit"
          disabled={saving || body.trim().length < 4}
          className="bg-[#0E6A3C] hover:bg-[#0E6A3C]/90"
        >
          {saving ? "보내는 중…" : "의견 보내기"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard">취소</Link>
        </Button>
      </div>
    </form>
  );
}
