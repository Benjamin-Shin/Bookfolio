"use client";

import type {
  BookOneLinerRow,
  ReadingEventRow,
  ReadingEventType,
  ReadingStatus,
  UserBookMemoRow
} from "@bookfolio/shared";
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const EVENT_LABEL_KO: Record<ReadingEventType, string> = {
  read_start: "읽기 시작",
  progress: "진도·페이지 저장",
  read_pause: "읽기 중지",
  read_complete: "완독",
  dropped: "하차"
};

/**
 * 도서 상세 — 한줄평·메모(마크다운)·독서 이벤트 UI.
 *
 * @history
 * - 2026-03-27: 메모 마크다운에 `remark-breaks` 적용 — 엔터(단일 줄바꿈)가 표시에 반영됨
 * - 2026-03-26: 빈 `userBookId`/`bookId`면 잘못된 fetch URL로 404 나는 문제 방지
 * - 2026-03-26: 신규
 */
export function BookDetailSidecars(props: { userBookId: string; bookId: string }) {
  const { userBookId, bookId } = props;
  const [oneLiners, setOneLiners] = useState<BookOneLinerRow[]>([]);
  const [myOneLiner, setMyOneLiner] = useState("");
  const [memos, setMemos] = useState<UserBookMemoRow[]>([]);
  const [newMemoMd, setNewMemoMd] = useState("");
  const [events, setEvents] = useState<ReadingEventRow[]>([]);
  const [pageInput, setPageInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadOneLiners = useCallback(async () => {
    const bid = bookId.trim();
    if (!bid) {
      setOneLiners([]);
      return;
    }
    const res = await fetch(`/api/books/${bid}/one-liners`, { credentials: "include" });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "한줄평을 불러오지 못했습니다.");
    setOneLiners((await res.json()) as BookOneLinerRow[]);
  }, [bookId]);

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
    await Promise.all([loadOneLiners(), loadMemos(), loadEvents()]);
  }, [loadEvents, loadMemos, loadOneLiners]);

  useEffect(() => {
    void refreshAll().catch((e) => setErr(e instanceof Error ? e.message : "불러오기 실패"));
  }, [refreshAll]);

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

  const saveOneLiner = async () => {
    setBusy(true);
    setErr(null);
    try {
      await postJson(`/api/me/books/${userBookId}/one-liner`, {
        action: "upsert",
        body: myOneLiner
      });
      setMyOneLiner("");
      await loadOneLiners();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const clearOneLiner = async () => {
    setBusy(true);
    setErr(null);
    try {
      await postJson(`/api/me/books/${userBookId}/one-liner`, { action: "clear" });
      await loadOneLiners();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
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

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-lg">한줄평</CardTitle>
          <CardDescription>
            소장 중인 책에 남긴 한줄평은 다른 사용자도 이 화면에서 볼 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="my-one-liner">내 한줄평 (500자)</Label>
            <Textarea
              id="my-one-liner"
              rows={2}
              value={myOneLiner}
              onChange={(e) => setMyOneLiner(e.target.value)}
              disabled={busy}
              placeholder="짧게 남겨 보세요."
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={busy} onClick={() => void saveOneLiner()}>
                저장
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void clearOneLiner()}>
                삭제
              </Button>
            </div>
          </div>
          <Separator />
          <ul className="space-y-3 text-sm">
            {oneLiners.length === 0 ? (
              <li className="text-muted-foreground">아직 한줄평이 없습니다.</li>
            ) : (
              oneLiners.map((o) => (
                <li key={`${o.userId}-${o.updatedAt}`} className="rounded-md border border-border/60 bg-muted/15 p-3">
                  <p className="font-medium">{o.displayName ?? "사용자"}</p>
                  <p className="mt-1 text-muted-foreground">{o.body}</p>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-lg">메모 (마크다운)</CardTitle>
          <CardDescription>인상 깊은 문장·느낌을 여러 개로 남길 수 있습니다.</CardDescription>
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

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-lg">독서 이벤트 (나만 보기)</CardTitle>
          <CardDescription>시작·진도·중지·완독·하차를 기록합니다. 읽기 상태도 함께 맞출 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void appendEvent("read_start", {}, "reading")}>
              읽기 시작
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void appendEvent("read_pause", {}, "paused")}>
              읽기 중지
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void appendEvent("read_complete", {}, "completed")}>
              완독
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void appendEvent("dropped", {}, "dropped")}>
              하차
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="cur-page">현재 페이지</Label>
              <Input
                id="cur-page"
                type="number"
                min={1}
                className="w-32"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                disabled={busy}
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => {
                const n = parseInt(pageInput, 10);
                const cur = Number.isFinite(n) && n > 0 ? n : null;
                void appendEvent("progress", cur != null ? { currentPage: cur } : {});
                setPageInput("");
              }}
            >
              페이지 저장
            </Button>
          </div>
          <Separator />
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {events.length === 0 ? (
              <li className="text-muted-foreground">기록된 이벤트가 없습니다.</li>
            ) : (
              events.map((ev) => (
                <li key={ev.id} className="rounded-md border border-border/50 px-3 py-2">
                  <span className="font-medium">{EVENT_LABEL_KO[ev.eventType]}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {new Date(ev.occurredAt).toLocaleString("ko-KR")}
                  </span>
                  {Object.keys(ev.payload).length > 0 ? (
                    <pre className="mt-1 whitespace-pre-wrap break-all text-xs text-muted-foreground">
                      {JSON.stringify(ev.payload)}
                    </pre>
                  ) : null}
                </li>
              ))
            )}
          </ul>
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
