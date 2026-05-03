"use client";

import type {
  ReadingEventRow,
  ReadingEventType,
  ReadingStatus,
  UserBookMemoRow,
} from "@bookfolio/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {
  BookOpen,
  Bookmark,
  CheckCircle,
  CircleSlash,
  Pause,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { TimelineLayout } from "@/components/ui/timeline-layout";
import { summarizeReadingEvent } from "@/lib/books/reading-event-payload-format";
import type { TimelineColor, TimelineElement } from "@/types";

const EVENT_LABEL_KO: Record<ReadingEventType, string> = {
  read_start: "읽기 시작",
  progress: "진도·페이지 저장",
  read_pause: "읽기 중지",
  read_complete: "완독",
  dropped: "하차",
};

function stableTimelineId(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) {
    h = (Math.imul(31, h) + uuid.charCodeAt(i)) | 0;
  }
  return h === 0 ? 1 : Math.abs(h);
}

function readingEventTimelineColor(t: ReadingEventType): TimelineColor {
  switch (t) {
    case "read_start":
      return "accent";
    case "progress":
      return "primary";
    case "read_pause":
      return "warning";
    case "read_complete":
      return "accent";
    case "dropped":
      return "destructive";
    default:
      return "muted";
  }
}

function ReadingEventTimelineIcon(t: ReadingEventType) {
  const iconClass = "size-4 shrink-0 text-white";
  switch (t) {
    case "read_start":
      return <BookOpen className={iconClass} aria-hidden />;
    case "progress":
      return <Bookmark className={iconClass} aria-hidden />;
    case "read_pause":
      return <Pause className={iconClass} aria-hidden />;
    case "read_complete":
      return <CheckCircle className={iconClass} aria-hidden />;
    case "dropped":
      return <CircleSlash className={iconClass} aria-hidden />;
    default:
      return <BookOpen className={iconClass} aria-hidden />;
  }
}

/**
 * 독서 이벤트 API 행을 `TimelineLayout`용 요소로 변환(시간 오름차순 — 레이아웃이 최신부터 표시).
 *
 * @history
 * - 2026-05-03: `TimelineLayout` 연동
 */
function toReadingTimelineElements(
  events: ReadingEventRow[],
  pageCount: number | null | undefined,
  readingTotalPages: number | null | undefined,
): TimelineElement[] {
  const totals = {
    pageCount: pageCount ?? null,
    readingTotalPages: readingTotalPages ?? null,
  };
  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
  return sorted.map((ev) => {
    const summary = summarizeReadingEvent(ev, totals);
    const typeLabel = EVENT_LABEL_KO[ev.eventType];
    const showDetailTitle = summary.title !== typeLabel;
    const lines = [
      showDetailTitle ? summary.title : null,
      summary.subtitle,
    ].filter((x): x is string => Boolean(x && String(x).trim()));
    return {
      id: stableTimelineId(ev.id),
      date: new Date(ev.occurredAt).toLocaleString("ko-KR"),
      title: typeLabel,
      description: lines.length > 0 ? lines.join("\n") : "\u00a0",
      icon: () => ReadingEventTimelineIcon(ev.eventType),
      color: readingEventTimelineColor(ev.eventType),
    };
  });
}

/**
 * 도서 상세 — 메모·독서 이벤트 UI. 한줄평은 `BookCanonInfoPanel`로 이전.
 *
 * @history
 * - 2026-05-03: 독서 이벤트를 `TimelineLayout`으로 표시; 메모 카드 제목에서 「마크다운」 문구 제거
 * - 2026-05-03: 한줄평 제거·독서 이벤트 `progress` 가독 요약·`pageCount`/`readingTotalPages` props
 * - 2026-03-27: 메모 마크다운에 `remark-breaks` 적용 — 엔터(단일 줄바꿈)가 표시에 반영됨
 * - 2026-03-26: 빈 `userBookId`면 잘못된 fetch URL로 404 나는 문제 방지
 * - 2026-03-26: 신규
 */
export function BookDetailSidecars(props: {
  userBookId: string;
  pageCount?: number | null;
  readingTotalPages?: number | null;
}) {
  const { userBookId, pageCount, readingTotalPages } = props;
  const [memos, setMemos] = useState<UserBookMemoRow[]>([]);
  const [newMemoMd, setNewMemoMd] = useState("");
  const [events, setEvents] = useState<ReadingEventRow[]>([]);
  const [pageInput, setPageInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadMemos = useCallback(async () => {
    const ub = userBookId.trim();
    if (!ub) {
      setMemos([]);
      return;
    }
    const res = await fetch(`/api/me/books/${ub}/memos`, { credentials: "include" });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "메모를 불러오지 못했습니다.");
    setMemos((await res.json()) as UserBookMemoRow[]);
  }, [userBookId]);

  const loadEvents = useCallback(async () => {
    const ub = userBookId.trim();
    if (!ub) {
      setEvents([]);
      return;
    }
    const res = await fetch(`/api/me/books/${ub}/reading-events`, { credentials: "include" });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "이벤트를 불러오지 못했습니다.");
    setEvents((await res.json()) as ReadingEventRow[]);
  }, [userBookId]);

  const refreshAll = useCallback(async () => {
    setErr(null);
    await Promise.all([loadMemos(), loadEvents()]);
  }, [loadEvents, loadMemos]);

  useEffect(() => {
    void refreshAll().catch((e) => setErr(e instanceof Error ? e.message : "불러오기 실패"));
  }, [refreshAll]);

  const readingTimelineItems = useMemo(
    () => toReadingTimelineElements(events, pageCount, readingTotalPages),
    [events, pageCount, readingTotalPages],
  );

  const postJson = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(typeof j.error === "string" ? j.error : "요청 실패");
    }
    return res;
  };

  const addMemo = async () => {
    setBusy(true);
    setErr(null);
    try {
      await postJson(`/api/me/books/${userBookId}/memos`, { action: "create", bodyMd: newMemoMd });
      setNewMemoMd("");
      await loadMemos();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "메모 추가 실패");
    } finally {
      setBusy(false);
    }
  };

  const appendEvent = async (
    eventType: ReadingEventType,
    payload: Record<string, unknown> = {},
    setReadingStatus?: ReadingStatus
  ) => {
    setBusy(true);
    setErr(null);
    try {
      await postJson(`/api/me/books/${userBookId}/reading-events`, {
        action: "append",
        eventType,
        payload,
        ...(setReadingStatus ? { setReadingStatus } : {})
      });
      await loadEvents();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "이벤트 기록 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {err ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      ) : null}

      <Card className="border-[#1A3C2F]/10 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#1A3C2F]">
            메모
          </CardTitle>
          <CardDescription className="text-[#434843]">
            인상 깊은 문장·느낌을 여러 개로 남길 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-memo">새 메모</Label>
            <Textarea
              id="new-memo"
              rows={5}
              value={newMemoMd}
              onChange={(e) => setNewMemoMd(e.target.value)}
              disabled={busy}
              placeholder="**굵게**, 인용, 목록 등 마크다운을 사용할 수 있어요."
            />
            <Button type="button" size="sm" disabled={busy} onClick={() => void addMemo()}>
              메모 추가
            </Button>
          </div>
          <Separator />
          <div className="space-y-6">
            {memos.length === 0 ? (
              <p className="text-sm text-muted-foreground">메모가 없습니다.</p>
            ) : (
              memos.map((m) => (
                <MemoRow key={m.id} memo={m} userBookId={userBookId} onSaved={() => void loadMemos()} busy={busy} setBusy={setBusy} setErr={setErr} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#1A3C2F]/10 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#1A3C2F]">
            독서 이벤트
          </CardTitle>
          <CardDescription className="text-[#434843]">
            나만 볼 수 있는 타임라인입니다. 시작·진도·중지·완독·하차를 기록하면
            읽기 상태도 함께 맞출 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              className="bg-[#F8F9FA]"
              onClick={() => void appendEvent("read_start", {}, "reading")}
            >
              읽기 시작
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              className="bg-[#F8F9FA]"
              onClick={() => void appendEvent("read_pause", {}, "paused")}
            >
              읽기 중지
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              className="bg-[#F8F9FA]"
              onClick={() => void appendEvent("read_complete", {}, "completed")}
            >
              완독
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              className="bg-[#F8F9FA]"
              onClick={() => void appendEvent("dropped", {}, "dropped")}
            >
              하차
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="cur-page" className="text-[#434843]">
                현재 페이지
              </Label>
              <Input
                id="cur-page"
                type="number"
                min={1}
                className="w-32 border-[#1A3C2F]/15"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                disabled={busy}
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              className="bg-[#1A3C2F] text-white hover:bg-[#1A3C2F]/90"
              onClick={() => {
                const n = parseInt(pageInput, 10);
                const cur = Number.isFinite(n) && n > 0 ? n : null;
                void appendEvent(
                  "progress",
                  cur != null ? { currentPage: cur } : {},
                );
                setPageInput("");
              }}
            >
              페이지 저장
            </Button>
          </div>
          <Separator className="bg-[#1A3C2F]/10" />
          <div className="max-h-[32rem] overflow-y-auto overflow-x-hidden pr-1">
            {events.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#1A3C2F]/15 bg-[#F8F9FA]/60 px-4 py-8 text-center text-sm text-[#675d53]">
                기록된 이벤트가 없습니다.
              </p>
            ) : (
              <TimelineLayout
                items={readingTimelineItems}
                size="sm"
                className="mx-0 max-w-none pt-4 pb-0"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function MemoRow(props: {
  memo: UserBookMemoRow;
  userBookId: string;
  onSaved: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setErr: (s: string | null) => void;
}) {
  const { memo, userBookId, onSaved, busy, setBusy, setErr } = props;
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(memo.bodyMd);

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/me/books/${userBookId}/memos`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id: memo.id, bodyMd: body })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "수정 실패");
      }
      setEditing(false);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "수정 실패");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/me/books/${userBookId}/memos`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: memo.id })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "삭제 실패");
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-border/60 p-3">
      {editing ? (
        <>
          <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} disabled={busy} />
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={() => void save()}>
              저장
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setEditing(false)}>
              취소
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="max-w-none text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
            <ReactMarkdown remarkPlugins={[remarkBreaks]}>{memo.bodyMd}</ReactMarkdown>
          </div>
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setEditing(true)}>
              수정
            </Button>
            <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => void del()}>
              삭제
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
