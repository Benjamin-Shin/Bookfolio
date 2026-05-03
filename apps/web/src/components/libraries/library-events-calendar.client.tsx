"use client";

import type {
  LibraryEventKind,
  LibraryEventRsvpStatus,
  LibraryEventSummary,
} from "@bookfolio/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

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

const EVENT_KIND_LABEL: Record<LibraryEventKind, string> = {
  meeting: "모임",
  social: "소셜",
  deadline: "마감",
};

const RSVP_LABEL: Record<
  NonNullable<LibraryEventSummary["myRsvpStatus"]>,
  string
> = {
  going: "참석",
  maybe: "미정",
  declined: "불참",
  pending: "미응답",
};

/** 표시·선택은 기기 로컬 달력과 맞춤(서버 구간은 UTC `YYYY-MM-DD` 규약). */
function localYmdFromIso(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatTimeRangeKo(ev: LibraryEventSummary): string {
  const s = new Date(ev.startsAt);
  const end = ev.endsAt ? new Date(ev.endsAt) : null;
  const opt: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const a = s.toLocaleString("ko-KR", opt);
  if (!end || end.getTime() === s.getTime()) {
    return a;
  }
  return `${a} – ${end.toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatRsvpTallyLine(ev: LibraryEventSummary): string {
  const t = ev.rsvpTally;
  const awaiting = t.pending + t.noResponse;
  const parts = [
    `참석 ${t.going}`,
    `미정 ${t.maybe}`,
    `불참 ${t.declined}`,
  ];
  if (awaiting > 0) {
    parts.push(`응답 전 ${awaiting}`);
  }
  return parts.join(" · ");
}

function parseDayItems(
  items: LibraryEventSummary[],
  selectedYmd: string,
): LibraryEventSummary[] {
  return items.filter((ev) => localYmdFromIso(ev.startsAt) === selectedYmd);
}

type LibraryEventsCalendarProps = {
  libraryId: string;
  isOwner: boolean;
  className?: string;
};

/**
 * 모임서가 일정 월 캘린더·일별 목록·RSVP(`GET/POST …/events`, `POST …/rsvp`).
 *
 * @history
 * - 2026-05-04: 멤버 전원 일정 추가·`rsvpTally` 참석 현황 한 줄
 * - 2026-05-04: 캘린더 좌측·일정 상세 우측 2열(내 서가 독서 캘린더 레이아웃 정렬)
 * - 2026-05-03: 신규
 */
export function LibraryEventsCalendar({
  libraryId,
  isOwner,
  className,
}: LibraryEventsCalendarProps) {
  const initial = useMemo(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  }, []);
  const [year, setYear] = useState(initial.y);
  const [month0, setMonth0] = useState(initial.m);
  const [items, setItems] = useState<LibraryEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);
  const [rsvpBusyId, setRsvpBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createStartsLocal, setCreateStartsLocal] = useState("");
  const [createKind, setCreateKind] = useState<LibraryEventKind>("meeting");

  const load = useCallback(async () => {
    const { from, to } = monthBoundsLocal(year, month0);
    setLoading(true);
    setError(null);
    setSelectedYmd(null);
    try {
      const u = `/api/me/libraries/${encodeURIComponent(libraryId)}/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const res = await fetch(u, { credentials: "include" });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          json && typeof json === "object" && "error" in json
            ? String((json as { error: unknown }).error)
            : "일정을 불러오지 못했습니다.";
        throw new Error(msg);
      }
      const arr =
        json && typeof json === "object" && "items" in json
          ? (json as { items: unknown }).items
          : [];
      const list: LibraryEventSummary[] = Array.isArray(arr)
        ? (arr as LibraryEventSummary[])
        : [];
      setItems(list);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "일정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [libraryId, year, month0]);

  useEffect(() => {
    void load();
  }, [load]);

  const countsByLocalDay = useMemo(() => {
    const m: Record<string, number> = {};
    for (const ev of items) {
      const k = localYmdFromIso(ev.startsAt);
      m[k] = (m[k] ?? 0) + 1;
    }
    return m;
  }, [items]);

  const firstWeekday = new Date(year, month0, 1).getDay();
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const onRsvp = async (eventId: string, status: LibraryEventRsvpStatus) => {
    setRsvpBusyId(eventId);
    try {
      const res = await fetch(
        `/api/me/libraries/${encodeURIComponent(libraryId)}/events/${encodeURIComponent(eventId)}/rsvp`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          json && typeof json === "object" && "error" in json
            ? String((json as { error: unknown }).error)
            : "저장에 실패했습니다.";
        throw new Error(msg);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "RSVP 저장 실패");
    } finally {
      setRsvpBusyId(null);
    }
  };

  const onCreate = async () => {
    const title = createTitle.trim();
    if (!title || !createStartsLocal) {
      setError("제목과 시작 일시를 입력해 주세요.");
      return;
    }
    const startsAt = new Date(createStartsLocal).toISOString();
    setCreateBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/me/libraries/${encodeURIComponent(libraryId)}/events`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            title,
            startsAt,
            eventKind: createKind,
          }),
        },
      );
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          json && typeof json === "object" && "error" in json
            ? String((json as { error: unknown }).error)
            : "일정을 만들지 못했습니다.";
        throw new Error(msg);
      }
      setCreateTitle("");
      setCreateStartsLocal("");
      setCreateKind("meeting");
      setShowCreate(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "일정 생성 실패");
    } finally {
      setCreateBusy(false);
    }
  };

  const onCancelEvent = async (eventId: string) => {
    if (!confirm("이 일정을 취소할까요? 멤버 캘린더에서 숨겨집니다.")) return;
    setRsvpBusyId(eventId);
    try {
      const res = await fetch(
        `/api/me/libraries/${encodeURIComponent(libraryId)}/events`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel", eventId }),
        },
      );
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          json && typeof json === "object" && "error" in json
            ? String((json as { error: unknown }).error)
            : "취소에 실패했습니다.";
        throw new Error(msg);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "취소 실패");
    } finally {
      setRsvpBusyId(null);
    }
  };

  const onDeleteEvent = async (eventId: string) => {
    if (!confirm("일정을 완전히 삭제할까요? RSVP도 함께 지워집니다.")) return;
    setRsvpBusyId(eventId);
    try {
      const res = await fetch(
        `/api/me/libraries/${encodeURIComponent(libraryId)}/events`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", eventId }),
        },
      );
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          json && typeof json === "object" && "error" in json
            ? String((json as { error: unknown }).error)
            : "삭제에 실패했습니다.";
        throw new Error(msg);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setRsvpBusyId(null);
    }
  };

  const dayRows =
    selectedYmd != null ? parseDayItems(items, selectedYmd) : [];

  return (
    <section
      className={cn(
        "rounded-2xl border border-[#1A3C2F]/10 bg-white p-5 shadow-[0_8px_30px_rgba(26,60,47,0.06)] md:p-6",
        className,
      )}
      aria-labelledby="library-events-heading"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 text-[#1A3C2F]" aria-hidden />
          <h2
            id="library-events-heading"
            className="font-serif text-lg font-semibold text-[#1A3C2F]"
          >
            모임 일정
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => {
              if (month0 === 0) {
                setMonth0(11);
                setYear((y) => y - 1);
              } else {
                setMonth0((m) => m - 1);
              }
            }}
            aria-label="이전 달"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[8.5rem] text-center text-sm font-medium text-[#1A3C2F]">
            {year}년 {month0 + 1}월
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => {
              if (month0 === 11) {
                setMonth0(0);
                setYear((y) => y + 1);
              } else {
                setMonth0((m) => m + 1);
              }
            }}
            aria-label="다음 달"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? "일정 추가 닫기" : "일정 추가"}
        </Button>
        {showCreate ? (
          <div className="mt-3 space-y-3 rounded-xl border border-[#1A3C2F]/10 bg-[#F8F9FA] p-4">
            <label className="block text-xs font-medium text-[#5c6560]">
              제목
              <input
                className="mt-1 w-full rounded-md border border-[#1A3C2F]/15 bg-white px-3 py-2 text-sm"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="예: 5월 정기 모임"
              />
            </label>
            <label className="block text-xs font-medium text-[#5c6560]">
              시작(로컬)
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-md border border-[#1A3C2F]/15 bg-white px-3 py-2 text-sm"
                value={createStartsLocal}
                onChange={(e) => setCreateStartsLocal(e.target.value)}
              />
            </label>
            <label className="block text-xs font-medium text-[#5c6560]">
              종류
              <select
                className="mt-1 w-full rounded-md border border-[#1A3C2F]/15 bg-white px-3 py-2 text-sm"
                value={createKind}
                onChange={(e) => setCreateKind(e.target.value as LibraryEventKind)}
              >
                <option value="meeting">{EVENT_KIND_LABEL.meeting}</option>
                <option value="social">{EVENT_KIND_LABEL.social}</option>
                <option value="deadline">{EVENT_KIND_LABEL.deadline}</option>
              </select>
            </label>
            <Button
              type="button"
              size="sm"
              className="bg-[#1A3C2F] hover:bg-[#1A3C2F]/90"
              disabled={createBusy}
              onClick={() => void onCreate()}
            >
              {createBusy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  저장 중
                </>
              ) : (
                "등록"
              )}
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mb-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-[#5c6560]">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          불러오는 중…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div>
            <p className="mb-2 text-xs leading-relaxed text-[#434843]">
              일정이 있는 날에는 숫자가 표시됩니다. 날짜를 누르면 오른쪽에서 상세,
              멤버 참석 현황, RSVP를 다룰 수 있습니다.
            </p>
            <div className="grid grid-cols-7 gap-1 border-b border-[#1A3C2F]/10 pb-2 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-[#5c6560]">
              {WEEKDAYS_KO.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (day == null) {
                  return <div key={`e-${idx}`} className="aspect-square min-h-9" />;
                }
                const ymd = ymdLocal(year, month0, day);
                const n = countsByLocalDay[ymd] ?? 0;
                const selected = selectedYmd === ymd;
                const has = n > 0;
                return (
                  <button
                    key={ymd}
                    type="button"
                    onClick={() =>
                      setSelectedYmd((prev) => (prev === ymd ? null : ymd))
                    }
                    className={cn(
                      "flex aspect-square min-h-9 flex-col items-center justify-center rounded-lg border text-sm transition-colors",
                      selected
                        ? "border-[#1A3C2F] bg-[#1A3C2F]/10 font-semibold text-[#1A3C2F]"
                        : has
                          ? "border-transparent bg-[#c5e6d4]/25 text-[#0f241c] hover:bg-[#1A3C2F]/10"
                          : "border-transparent text-[#5c6560]/70 hover:bg-[#1A3C2F]/5",
                    )}
                    aria-pressed={selected}
                  >
                    <span className="tabular-nums">{day}</span>
                    {has ? (
                      <span className="mt-0.5 text-[0.6rem] font-bold text-[#b8860b]">
                        {n}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-[#1A3C2F]/12 bg-[#F8F9FA]/90 p-4">
            <h3 className="text-sm font-semibold text-[#1A3C2F]">
              {selectedYmd
                ? `${selectedYmd.replace(/-/g, ".")} 일정`
                : "날짜를 선택하면 일정이 표시됩니다."}
            </h3>
            {!selectedYmd ? (
              <p className="text-sm text-[#5c6560]">
                달력에서 날짜를 눌러 모임 일정과 RSVP를 확인해 보세요.
              </p>
            ) : dayRows.length === 0 ? (
              <p className="text-sm text-[#5c6560]">
                이 날짜에 등록된 일정이 없습니다.
              </p>
            ) : (
              <ul className="space-y-3">
                {dayRows.map((ev) => (
                  <li
                    key={ev.id}
                    className="rounded-xl border border-[#1A3C2F]/10 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-[#1A3C2F]">{ev.title}</p>
                        <p className="text-xs text-[#5c6560]">
                          {formatTimeRangeKo(ev)} · {EVENT_KIND_LABEL[ev.eventKind]}
                        </p>
                        {ev.location ? (
                          <p className="text-xs text-[#5c6560]">{ev.location}</p>
                        ) : null}
                        <p className="mt-1.5 text-xs text-[#1A3C2F]/90">
                          {formatRsvpTallyLine(ev)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(
                          ["going", "maybe", "declined", "pending"] as const
                        ).map((st) => {
                          const active =
                            ev.myRsvpStatus === st ||
                            (ev.myRsvpStatus == null && st === "pending");
                          return (
                            <Button
                              key={st}
                              type="button"
                              variant={active ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                "h-7 text-[0.65rem]",
                                active && "bg-[#1A3C2F]",
                              )}
                              disabled={rsvpBusyId === ev.id}
                              onClick={() => void onRsvp(ev.id, st)}
                            >
                              {RSVP_LABEL[st]}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    {isOwner ? (
                      <div className="mt-2 flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-[#5c6560]"
                          disabled={rsvpBusyId === ev.id}
                          onClick={() => void onCancelEvent(ev.id)}
                        >
                          취소 처리
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-700"
                          disabled={rsvpBusyId === ev.id}
                          onClick={() => void onDeleteEvent(ev.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
