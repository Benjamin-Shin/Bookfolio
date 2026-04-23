"use client";

import type { ReadingEventType } from "@bookfolio/shared";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function ymdLocal(year: number, month0: number, day: number): string {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

function monthBoundsLocal(year: number, month0: number): { from: string; to: string } {
  const lastDay = new Date(year, month0 + 1, 0).getDate();
  return {
    from: ymdLocal(year, month0, 1),
    to: ymdLocal(year, month0, lastDay),
  };
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

const EVENT_LABEL_KO: Record<ReadingEventType, string> = {
  read_start: "읽기 시작",
  progress: "진행",
  read_pause: "일시중단",
  read_complete: "완독",
  dropped: "하차",
};

type DayEventRow = {
  id: string;
  userBookId: string;
  eventType: ReadingEventType;
  occurredAt: string;
  title: string;
  authorsLine: string;
  coverUrl: string | null;
};

function parseDayEventRows(json: unknown): DayEventRow[] {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return [];
  }
  const items = (json as { items?: unknown }).items;
  if (!Array.isArray(items)) {
    return [];
  }
  const out: DayEventRow[] = [];
  for (const row of items) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const r = row as Record<string, unknown>;
    const et = r.eventType;
    if (typeof et !== "string") {
      continue;
    }
    out.push({
      id: String(r.id ?? ""),
      userBookId: String(r.userBookId ?? ""),
      eventType: et as ReadingEventType,
      occurredAt: String(r.occurredAt ?? ""),
      title: String(r.title ?? ""),
      authorsLine: String(r.authorsLine ?? ""),
      coverUrl: typeof r.coverUrl === "string" ? r.coverUrl : null,
    });
  }
  return out;
}

type DashboardReadingEventsCalendarProps = {
  className?: string;
};

/**
 * 독서 이벤트 일별 집계 캘린더(API `GET /api/me/reading-events/calendar`),
 * 이벤트가 있는 날 선택 시 `GET /api/me/reading-events/by-day` 상세 테이블.
 *
 * @history
 * - 2026-03-26: 일 선택 시 표지·도서·이벤트 타입 테이블(`by-day` API)
 * - 2026-03-26: 신규 — 대시보드용 월 이동·일별 건수 표시
 */
export function DashboardReadingEventsCalendar({
  className,
}: DashboardReadingEventsCalendarProps) {
  const initial = useMemo(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  }, []);
  const [year, setYear] = useState(initial.y);
  const [month0, setMonth0] = useState(initial.m);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);
  const [dayRows, setDayRows] = useState<DayEventRow[]>([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { from, to } = monthBoundsLocal(year, month0);
    setLoading(true);
    setError(null);
    setSelectedYmd(null);
    setDayRows([]);
    setDayError(null);
    try {
      const u = `/api/me/reading-events/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const res = await fetch(u, { credentials: "include" });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          json &&
          typeof json === "object" &&
          "error" in json &&
          typeof (json as { error: unknown }).error === "string"
            ? (json as { error: string }).error
            : "불러오기에 실패했습니다.";
        setError(msg);
        setCounts({});
        return;
      }
      if (!json || typeof json !== "object" || Array.isArray(json)) {
        setCounts({});
        return;
      }
      const next: Record<string, number> = {};
      for (const [k, v] of Object.entries(json as Record<string, unknown>)) {
        const n = Number(v);
        if (Number.isFinite(n)) {
          next[k] = n;
        }
      }
      setCounts(next);
    } catch {
      setError("네트워크 오류가 났습니다.");
      setCounts({});
    } finally {
      setLoading(false);
    }
  }, [year, month0]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedYmd) {
      setDayRows([]);
      setDayError(null);
      setDayLoading(false);
      return;
    }
    let cancelled = false;
    setDayLoading(true);
    setDayError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/me/reading-events/by-day?day=${encodeURIComponent(selectedYmd)}`,
          { credentials: "include" },
        );
        const json: unknown = await res.json();
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          const msg =
            json &&
            typeof json === "object" &&
            "error" in json &&
            typeof (json as { error: unknown }).error === "string"
              ? (json as { error: string }).error
              : "목록을 불러오지 못했습니다.";
          setDayError(msg);
          setDayRows([]);
          return;
        }
        setDayRows(parseDayEventRows(json));
      } catch {
        if (!cancelled) {
          setDayError("네트워크 오류가 났습니다.");
          setDayRows([]);
        }
      } finally {
        if (!cancelled) {
          setDayLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedYmd]);

  const goPrev = () => {
    if (month0 === 0) {
      setMonth0(11);
      setYear((y) => y - 1);
    } else {
      setMonth0((m) => m - 1);
    }
  };

  const goNext = () => {
    if (month0 === 11) {
      setMonth0(0);
      setYear((y) => y + 1);
    } else {
      setMonth0((m) => m + 1);
    }
  };

  const first = new Date(year, month0, 1);
  const last = new Date(year, month0 + 1, 0);
  const leadBlank = first.getDay();
  const daysInMonth = last.getDate();

  const cells: ({ kind: "blank" } | { kind: "day"; day: number })[] = [];
  for (let i = 0; i < leadBlank; i++) {
    cells.push({ kind: "blank" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ kind: "day", day: d });
  }

  const title = `${year}년 ${month0 + 1}월`;

  const eventLabel = (t: ReadingEventType): string =>
    EVENT_LABEL_KO[t] ?? t;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-4 shadow-sm",
        loading && "opacity-90",
        className,
      )}
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">독서 이벤트 캘린더</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            책 상세에서 기록한 독서 이벤트가 날짜별로 집계됩니다. 숫자가 있는 날을 누르면
            아래에 목록이 표시됩니다.
          </p>
        </div>
        <div className="flex items-center justify-center gap-1 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={goPrev}
            aria-label="이전 달"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[6.5rem] text-center text-sm font-medium tabular-nums">
            {title}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={goNext}
            aria-label="다음 달"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      {error ? (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <div className="grid grid-cols-7 gap-1 border-b border-border/60 pb-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {WEEKDAYS_KO.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {cells.map((c, idx) => {
              if (c.kind === "blank") {
                return <div key={`b-${idx}`} className="aspect-square min-h-9" />;
              }
              const keyYmd = ymdLocal(year, month0, c.day);
              const n = counts[keyYmd];
              const has = n !== undefined && n > 0;
              const selected = selectedYmd === keyYmd;
              return (
                <button
                  key={keyYmd}
                  type="button"
                  disabled={!has}
                  onClick={() => {
                    if (!has) {
                      return;
                    }
                    setSelectedYmd((prev) => (prev === keyYmd ? null : keyYmd));
                  }}
                  className={cn(
                    "flex aspect-square min-h-9 flex-col items-center justify-center rounded-md border text-sm transition-colors",
                    !has && "cursor-default opacity-50",
                    has && "cursor-pointer hover:bg-muted/50",
                    has &&
                      !selected &&
                      "border-transparent bg-muted/25 text-muted-foreground",
                    has &&
                      selected &&
                      "border-primary bg-primary/15 font-medium text-foreground shadow-sm",
                    !has && "border-transparent bg-muted/20 text-muted-foreground",
                  )}
                  aria-pressed={selected}
                  aria-label={
                    has
                      ? `${c.day}일, 이벤트 ${n}건${selected ? ", 선택됨" : ""}`
                      : `${c.day}일`
                  }
                >
                  <span className="tabular-nums leading-none">{c.day}</span>
                  {has ? (
                    <span className="mt-0.5 text-[10px] font-semibold tabular-nums text-primary">
                      {n}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-border/80 bg-muted/10 p-3">
          <h3 className="text-sm font-semibold text-foreground">
            {selectedYmd
              ? `${selectedYmd.replace(/-/g, ".")} 이벤트`
              : "일자를 선택하면 이벤트가 표시됩니다."}
          </h3>
          {dayError ? (
            <p className="text-sm text-destructive" role="alert">
              {dayError}
            </p>
          ) : null}
          {dayLoading ? (
            <p className="text-xs text-muted-foreground">목록 불러오는 중…</p>
          ) : null}
          {selectedYmd && !dayLoading && !dayError && dayRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">표시할 이벤트가 없습니다.</p>
          ) : null}
          {!dayLoading && dayRows.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border/80">
              <table className="w-full min-w-[26rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/35">
                    <th className="w-16 px-3 py-2 font-medium" scope="col">
                      표지
                    </th>
                    <th className="px-3 py-2 font-medium" scope="col">
                      도서
                    </th>
                    <th className="w-28 px-3 py-2 font-medium" scope="col">
                      이벤트
                    </th>
                    <th className="w-40 px-3 py-2 font-medium" scope="col">
                      시각
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dayRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/60 last:border-b-0"
                    >
                      <td className="px-3 py-2 align-middle">
                        <Link
                          href={`/dashboard/books/${row.userBookId}`}
                          className="block shrink-0"
                        >
                          {row.coverUrl ? (
                            <img
                              src={row.coverUrl}
                              alt=""
                              width={48}
                              height={64}
                              className="h-16 w-12 rounded object-cover ring-1 ring-border"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className="flex h-16 w-12 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground"
                              aria-hidden
                            >
                              없음
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Link
                          href={`/dashboard/books/${row.userBookId}`}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {row.title || "제목 없음"}
                        </Link>
                        {row.authorsLine ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">{row.authorsLine}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 align-middle text-muted-foreground">
                        {eventLabel(row.eventType)}
                      </td>
                      <td className="px-3 py-2 align-middle tabular-nums text-muted-foreground">
                        {row.occurredAt
                          ? new Date(row.occurredAt).toLocaleString("ko-KR", {
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
