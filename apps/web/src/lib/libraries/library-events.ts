import type {
  LibraryEventKind,
  LibraryEventRsvpStatus,
  LibraryEventRsvpTally,
  LibraryEventSummary,
} from "@bookfolio/shared";

import type { RepositoryContext } from "@/lib/books/repository";
import { assertLibraryMember, assertLibraryOwner } from "@/lib/libraries/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

import type { SupabaseClient } from "@supabase/supabase-js";

type DbLibraryEventRow = {
  id: string;
  library_id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_kind: string;
  starts_at: string;
  ends_at: string | null;
  created_by: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

async function getClient(context?: RepositoryContext) {
  return createSupabaseAdminClient();
}

/** UTC 달력 `YYYY-MM-DD` 하루 구간(독서 캘린더와 동일 규약). */
function utcDayRangeIso(dayYmd: string): { startIso: string; endExclusiveIso: string } {
  const trimmed = dayYmd.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    throw new Error("Invalid day");
  }
  const y = parseInt(match[1], 10);
  const mo = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  const start = new Date(Date.UTC(y, mo - 1, d));
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 1);
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(next.getUTCDate()).padStart(2, "0");
  return {
    startIso: `${trimmed}T00:00:00.000Z`,
    endExclusiveIso: `${yy}-${mm}-${dd}T00:00:00.000Z`,
  };
}

/**
 * `from`~`to` UTC 달력일(양끝 포함)을 timestamptz 구간으로 변환.
 *
 * @history
 * - 2026-05-03: 신규 — `list_library_events_in_range` RPC 인자용
 */
export function utcRangeFromInclusiveYmds(
  fromYmd: string,
  toYmd: string,
): { rangeStartIso: string; rangeEndExclusiveIso: string } {
  const { startIso } = utcDayRangeIso(fromYmd);
  const { endExclusiveIso } = utcDayRangeIso(toYmd);
  return { rangeStartIso: startIso, rangeEndExclusiveIso: endExclusiveIso };
}

function isLibraryEventKind(v: string): v is LibraryEventKind {
  return v === "meeting" || v === "social" || v === "deadline";
}

function emptyRsvpTally(memberCount: number): LibraryEventRsvpTally {
  return {
    going: 0,
    maybe: 0,
    declined: 0,
    pending: 0,
    noResponse: memberCount,
  };
}

function mapEventRow(
  row: DbLibraryEventRow,
  myRsvpStatus: LibraryEventRsvpStatus | null,
  rsvpTally: LibraryEventRsvpTally,
): LibraryEventSummary {
  const ek = row.event_kind;
  return {
    id: row.id,
    libraryId: row.library_id,
    title: row.title,
    description: row.description,
    location: row.location,
    eventKind: isLibraryEventKind(ek) ? ek : "meeting",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cancelledAt: row.cancelled_at,
    myRsvpStatus,
    rsvpTally,
  };
}

async function countLibraryMembers(
  supabase: SupabaseClient,
  libraryId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("library_members")
    .select("user_id", { count: "exact", head: true })
    .eq("library_id", libraryId);
  if (error) {
    throw error;
  }
  return count ?? 0;
}

/**
 * 일정 ID마다 RSVP 상태별 인원 수·미작성 인원(`멤버 − RSVP 행 수`).
 *
 * @history
 * - 2026-05-04: 모임서가 일정 상세 참석 현황 표시용
 */
async function fetchRsvpTalliesForEvents(
  supabase: SupabaseClient,
  eventIds: string[],
  memberCount: number,
): Promise<Map<string, LibraryEventRsvpTally>> {
  const out = new Map<string, LibraryEventRsvpTally>();
  for (const id of eventIds) {
    out.set(id, emptyRsvpTally(memberCount));
  }
  if (eventIds.length === 0) {
    return out;
  }
  const { data, error } = await supabase
    .from("library_event_rsvps")
    .select("library_event_id, status")
    .in("library_event_id", eventIds);
  if (error) {
    throw error;
  }
  const acc = new Map<
    string,
    { going: number; maybe: number; declined: number; pending: number; total: number }
  >();
  for (const id of eventIds) {
    acc.set(id, { going: 0, maybe: 0, declined: 0, pending: 0, total: 0 });
  }
  for (const r of data ?? []) {
    const eid = (r as { library_event_id: string }).library_event_id;
    const st = (r as { status: string }).status;
    const cur = acc.get(eid);
    if (!cur) {
      continue;
    }
    cur.total += 1;
    if (st === "going") {
      cur.going += 1;
    } else if (st === "maybe") {
      cur.maybe += 1;
    } else if (st === "declined") {
      cur.declined += 1;
    } else if (st === "pending") {
      cur.pending += 1;
    }
  }
  for (const id of eventIds) {
    const cur = acc.get(id)!;
    out.set(id, {
      going: cur.going,
      maybe: cur.maybe,
      declined: cur.declined,
      pending: cur.pending,
      noResponse: Math.max(0, memberCount - cur.total),
    });
  }
  return out;
}

async function mapEventsWithRsvpAndTally(
  supabase: SupabaseClient,
  libraryId: string,
  list: DbLibraryEventRow[],
  requesterUserId: string,
): Promise<LibraryEventSummary[]> {
  if (list.length === 0) {
    return [];
  }
  const memberCount = await countLibraryMembers(supabase, libraryId);
  const ids = list.map((r) => r.id);
  const [tallyMap, rsvpMap] = await Promise.all([
    fetchRsvpTalliesForEvents(supabase, ids, memberCount),
    fetchMyRsvpStatuses(supabase, ids, requesterUserId),
  ]);
  return list.map((r) =>
    mapEventRow(r, rsvpMap.get(r.id) ?? null, tallyMap.get(r.id) ?? emptyRsvpTally(memberCount)),
  );
}

async function fetchMyRsvpStatuses(
  supabase: SupabaseClient,
  eventIds: string[],
  userId: string,
): Promise<Map<string, LibraryEventRsvpStatus>> {
  const out = new Map<string, LibraryEventRsvpStatus>();
  if (eventIds.length === 0) {
    return out;
  }
  const { data, error } = await supabase
    .from("library_event_rsvps")
    .select("library_event_id, status")
    .eq("user_id", userId)
    .in("library_event_id", eventIds);
  if (error) {
    throw error;
  }
  for (const r of data ?? []) {
    const id = (r as { library_event_id: string }).library_event_id;
    const st = (r as { status: string }).status;
    if (
      st === "going" ||
      st === "maybe" ||
      st === "declined" ||
      st === "pending"
    ) {
      out.set(id, st);
    }
  }
  return out;
}

/**
 * 구간과 겹치는 모임 일정 목록 + 현재 사용자 RSVP.
 *
 * @history
 * - 2026-05-04: 멤버별 RSVP 집계 `rsvpTally` 포함
 * - 2026-05-03: `list_library_events_in_range` RPC·RSVP 조회
 */
export async function listLibraryEventsInRange(
  libraryId: string,
  requesterUserId: string,
  rangeStartIso: string,
  rangeEndExclusiveIso: string,
  context?: RepositoryContext,
): Promise<LibraryEventSummary[]> {
  await assertLibraryMember(libraryId, requesterUserId, context);
  const supabase = await getClient(context);

  const { data: rows, error } = await supabase.rpc("list_library_events_in_range", {
    p_library_id: libraryId,
    p_range_start: rangeStartIso,
    p_range_end_exclusive: rangeEndExclusiveIso,
  });
  if (error) {
    throw error;
  }
  const list = (rows ?? []) as DbLibraryEventRow[];
  return mapEventsWithRsvpAndTally(supabase, libraryId, list, requesterUserId);
}

export type CreateLibraryEventInput = {
  title: string;
  description?: string | null;
  location?: string | null;
  eventKind?: LibraryEventKind;
  startsAt: string;
  endsAt?: string | null;
};

/**
 * 모임서가 일정 생성(멤버 누구나).
 *
 * @history
 * - 2026-05-04: `assertLibraryMember` — 소유자가 아닌 멤버도 일정 추가 가능
 * - 2026-05-03: 신규
 */
export async function createLibraryEvent(
  libraryId: string,
  input: CreateLibraryEventInput,
  creatorUserId: string,
  context?: RepositoryContext,
): Promise<LibraryEventSummary> {
  await assertLibraryMember(libraryId, creatorUserId, context);
  const supabase = await getClient(context);
  const kind = input.eventKind ?? "meeting";
  const { data, error } = await supabase
    .from("library_events")
    .insert({
      library_id: libraryId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      event_kind: kind,
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
      created_by: creatorUserId,
    })
    .select(
      "id, library_id, title, description, location, event_kind, starts_at, ends_at, created_by, cancelled_at, created_at, updated_at",
    )
    .single();
  if (error) {
    throw error;
  }
  const row = data as DbLibraryEventRow;
  const mapped = await mapEventsWithRsvpAndTally(supabase, libraryId, [row], creatorUserId);
  return mapped[0]!;
}

export type UpdateLibraryEventInput = {
  eventId: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  eventKind?: LibraryEventKind;
  startsAt?: string;
  endsAt?: string | null;
};

/**
 * 모임서가 일정 수정(소유자만).
 *
 * @history
 * - 2026-05-03: 신규
 */
export async function updateLibraryEvent(
  libraryId: string,
  input: UpdateLibraryEventInput,
  ownerUserId: string,
  context?: RepositoryContext,
): Promise<LibraryEventSummary> {
  await assertLibraryOwner(libraryId, ownerUserId, context);
  const supabase = await getClient(context);
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null;
  }
  if (input.location !== undefined) {
    patch.location = input.location?.trim() || null;
  }
  if (input.eventKind !== undefined) patch.event_kind = input.eventKind;
  if (input.startsAt !== undefined) patch.starts_at = input.startsAt;
  if (input.endsAt !== undefined) patch.ends_at = input.endsAt;
  if (Object.keys(patch).length === 0) {
    throw new Error("수정할 필드가 없습니다.");
  }

  const { data, error } = await supabase
    .from("library_events")
    .update(patch)
    .eq("id", input.eventId)
    .eq("library_id", libraryId)
    .select(
      "id, library_id, title, description, location, event_kind, starts_at, ends_at, created_by, cancelled_at, created_at, updated_at",
    )
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("일정을 찾을 수 없습니다.");
  }
  const mapped = await mapEventsWithRsvpAndTally(supabase, libraryId, [data as DbLibraryEventRow], ownerUserId);
  return mapped[0]!;
}

/**
 * 모임서가 일정 삭제(소유자만, RSVP CASCADE).
 *
 * @history
 * - 2026-05-03: 신규
 */
export async function deleteLibraryEvent(
  libraryId: string,
  eventId: string,
  ownerUserId: string,
  context?: RepositoryContext,
): Promise<void> {
  await assertLibraryOwner(libraryId, ownerUserId, context);
  const supabase = await getClient(context);
  const { data, error } = await supabase
    .from("library_events")
    .delete()
    .eq("id", eventId)
    .eq("library_id", libraryId)
    .select("id")
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("일정을 찾을 수 없습니다.");
  }
}

/**
 * 모임서가 일정 취소(소유자만, `cancelled_at` 설정).
 *
 * @history
 * - 2026-05-03: 신규
 */
export async function cancelLibraryEvent(
  libraryId: string,
  eventId: string,
  ownerUserId: string,
  context?: RepositoryContext,
): Promise<LibraryEventSummary> {
  await assertLibraryOwner(libraryId, ownerUserId, context);
  const supabase = await getClient(context);
  const { data, error } = await supabase
    .from("library_events")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("library_id", libraryId)
    .select(
      "id, library_id, title, description, location, event_kind, starts_at, ends_at, created_by, cancelled_at, created_at, updated_at",
    )
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("일정을 찾을 수 없습니다.");
  }
  const mapped = await mapEventsWithRsvpAndTally(supabase, libraryId, [data as DbLibraryEventRow], ownerUserId);
  return mapped[0]!;
}

/**
 * 본인 RSVP 설정(멤버 누구나).
 *
 * @history
 * - 2026-05-03: 신규
 */
export async function setLibraryEventRsvp(
  libraryId: string,
  eventId: string,
  status: LibraryEventRsvpStatus,
  userId: string,
  context?: RepositoryContext,
): Promise<void> {
  await assertLibraryMember(libraryId, userId, context);
  const supabase = await getClient(context);
  const { data: ev, error: evErr } = await supabase
    .from("library_events")
    .select("id")
    .eq("id", eventId)
    .eq("library_id", libraryId)
    .is("cancelled_at", null)
    .maybeSingle();
  if (evErr) {
    throw evErr;
  }
  if (!ev) {
    throw new Error("일정을 찾을 수 없거나 취소되었습니다.");
  }
  const { error } = await supabase.from("library_event_rsvps").upsert(
    {
      library_event_id: eventId,
      user_id: userId,
      status,
      note: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "library_event_id,user_id" },
  );
  if (error) {
    throw error;
  }
}
