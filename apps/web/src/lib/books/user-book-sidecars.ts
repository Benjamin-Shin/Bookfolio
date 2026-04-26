import type {
  BookOneLinerRow,
  ReadingEventRow,
  ReadingEventType,
  ReadingLeaderboardResponse,
  ReadingStatus,
  UserBookMemoRow,
} from "@bookfolio/shared";

import { tryRecordDailyActivityCheckIn } from "@/lib/points/daily-check-in";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

import type { RepositoryContext } from "./repository";

function getAdminContext(ctx: RepositoryContext) {
  return { supabase: createSupabaseAdminClient(), userId: ctx.userId };
}

/**
 * 개인 메모·한줄평·독서 이벤트·리더보드(0018 마이그레이션).
 *
 * @history
 * - 2026-03-28: `parseLeaderboardPayload` export — 집계 API에서 재사용
 * - 2026-03-28: 독서 이벤트 추가 시 일일 출석(`tryRecordDailyActivityCheckIn`) 시도
 * - 2026-03-26: `listReadingEventsForUtcDayWithBooks` — 일별 이벤트+도서 메타(대시보드 캘린더)
 * - 2026-03-26: 신규 — memo 분리·한줄평·이벤트·집계 RPC 연동
 */

export async function listUserBookMemos(
  userBookId: string,
  context: RepositoryContext,
): Promise<UserBookMemoRow[]> {
  const { supabase, userId } = getAdminContext(context);
  const { data: ub, error: e0 } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", userBookId)
    .eq("user_id", userId)
    .maybeSingle();
  if (e0) throw e0;
  if (!ub) {
    return [];
  }
  const { data, error } = await supabase
    .from("user_book_memos")
    .select("id, user_book_id, body_md, created_at, updated_at")
    .eq("user_book_id", userBookId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    userBookId: r.user_book_id as string,
    bodyMd: r.body_md as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));
}

export async function createUserBookMemo(
  userBookId: string,
  bodyMd: string,
  context: RepositoryContext,
): Promise<UserBookMemoRow> {
  const { supabase, userId } = getAdminContext(context);
  const body = bodyMd.trim();
  if (!body) {
    throw new Error("메모 내용을 입력해 주세요.");
  }
  const { data: ub, error: e0 } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", userBookId)
    .eq("user_id", userId)
    .maybeSingle();
  if (e0) throw e0;
  if (!ub) {
    throw new Error("Not found");
  }
  const { data, error } = await supabase
    .from("user_book_memos")
    .insert({ user_book_id: userBookId, body_md: body })
    .select("id, user_book_id, body_md, created_at, updated_at")
    .single();
  if (error) throw error;
  const r = data as Record<string, unknown>;
  return {
    id: r.id as string,
    userBookId: r.user_book_id as string,
    bodyMd: r.body_md as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function updateUserBookMemo(
  userBookId: string,
  memoId: string,
  bodyMd: string,
  context: RepositoryContext,
): Promise<UserBookMemoRow> {
  const { supabase, userId } = getAdminContext(context);
  const body = bodyMd.trim();
  if (!body) {
    throw new Error("메모 내용을 입력해 주세요.");
  }
  const { data: row, error: e0 } = await supabase
    .from("user_book_memos")
    .select("id, user_book_id")
    .eq("id", memoId)
    .maybeSingle();
  if (e0) throw e0;
  if (!row || row.user_book_id !== userBookId) {
    throw new Error("Not found");
  }
  const { data: ub, error: e1 } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", userBookId)
    .eq("user_id", userId)
    .maybeSingle();
  if (e1) throw e1;
  if (!ub) {
    throw new Error("Not found");
  }
  const { data, error } = await supabase
    .from("user_book_memos")
    .update({ body_md: body })
    .eq("id", memoId)
    .select("id, user_book_id, body_md, created_at, updated_at")
    .single();
  if (error) throw error;
  const r = data as Record<string, unknown>;
  return {
    id: r.id as string,
    userBookId: r.user_book_id as string,
    bodyMd: r.body_md as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function deleteUserBookMemo(
  userBookId: string,
  memoId: string,
  context: RepositoryContext,
): Promise<void> {
  const { supabase, userId } = getAdminContext(context);
  const { data: row, error: e0 } = await supabase
    .from("user_book_memos")
    .select("id, user_book_id")
    .eq("id", memoId)
    .maybeSingle();
  if (e0) throw e0;
  if (!row || row.user_book_id !== userBookId) {
    throw new Error("Not found");
  }
  const { data: ub, error: e1 } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", userBookId)
    .eq("user_id", userId)
    .maybeSingle();
  if (e1) throw e1;
  if (!ub) {
    throw new Error("Not found");
  }
  const { error } = await supabase
    .from("user_book_memos")
    .delete()
    .eq("id", memoId);
  if (error) throw error;
}

/** 모임서가 공유 시 한 줄 메모 — `user_book_memos`에 추가 */
export async function appendUserBookMemoLine(
  userBookId: string,
  bodyMd: string,
  context: RepositoryContext,
): Promise<void> {
  const trimmed = bodyMd.trim();
  if (!trimmed) return;
  await createUserBookMemo(userBookId, trimmed, context);
}

export async function fetchLatestMemoPreviewsForUserBookIds(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userBookIds: string[],
  maxLen = 120,
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  for (const id of userBookIds) {
    out.set(id, null);
  }
  const unique = [...new Set(userBookIds)].filter(Boolean);
  if (unique.length === 0) {
    return out;
  }
  const { data, error } = await supabase
    .from("user_book_memos")
    .select("user_book_id, body_md, updated_at")
    .in("user_book_id", unique)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const seen = new Set<string>();
  for (const r of data ?? []) {
    const ubid = r.user_book_id as string;
    if (seen.has(ubid)) continue;
    seen.add(ubid);
    const raw = (r.body_md as string)?.trim() ?? "";
    const oneLine =
      raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find(Boolean) ?? "";
    const preview =
      oneLine.length > maxLen
        ? `${oneLine.slice(0, maxLen)}…`
        : oneLine || null;
    out.set(ubid, preview);
  }
  return out;
}

export async function listBookOneLinersForBook(
  bookId: string,
): Promise<BookOneLinerRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data: rows, error } = await supabase
    .from("book_one_liners")
    .select("user_id, body, updated_at")
    .eq("book_id", bookId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const userIds = [...new Set((rows ?? []).map((r) => r.user_id as string))];
  const profNames = new Map<string, string | null>();
  const userMap = new Map<string, { name: string | null; email: string }>();
  if (userIds.length > 0) {
    const { data: profs, error: pe } = await supabase
      .from("app_profiles")
      .select("id, display_name")
      .in("id", userIds);
    if (pe) throw pe;
    for (const p of profs ?? []) {
      profNames.set(p.id as string, (p.display_name as string | null) ?? null);
    }
    const { data: users, error: ue } = await supabase
      .from("app_users")
      .select("id, name, email")
      .in("id", userIds);
    if (ue) throw ue;
    for (const u of users ?? []) {
      userMap.set(u.id as string, {
        name: (u.name as string | null) ?? null,
        email: (u.email as string) ?? "",
      });
    }
  }
  return (rows ?? []).map((r) => {
    const uid = r.user_id as string;
    const profName = profNames.get(uid) ?? null;
    const u = userMap.get(uid);
    const displayName =
      profName?.trim() ||
      u?.name?.trim() ||
      (u?.email ? u.email.split("@")[0] : null) ||
      null;
    return {
      userId: uid,
      displayName,
      body: r.body as string,
      updatedAt: r.updated_at as string,
    };
  });
}

export async function upsertMyBookOneLiner(
  userBookId: string,
  body: string,
  context: RepositoryContext,
): Promise<void> {
  const { supabase, userId } = getAdminContext(context);
  const text = body.trim();
  if (!text) {
    throw new Error("한줄평을 입력해 주세요.");
  }
  if (text.length > 500) {
    throw new Error("한줄평은 500자 이내로 입력해 주세요.");
  }
  const { data: ub, error: e0 } = await supabase
    .from("user_books")
    .select("id, book_id")
    .eq("id", userBookId)
    .eq("user_id", userId)
    .maybeSingle();
  if (e0) throw e0;
  if (!ub?.book_id) {
    throw new Error("Not found");
  }
  const { error } = await supabase.from("book_one_liners").upsert(
    {
      user_id: userId,
      book_id: ub.book_id as string,
      body: text,
    },
    { onConflict: "user_id,book_id" },
  );
  if (error) throw error;
}

export async function clearMyBookOneLiner(
  userBookId: string,
  context: RepositoryContext,
): Promise<void> {
  const { supabase, userId } = getAdminContext(context);
  const { data: ub, error: e0 } = await supabase
    .from("user_books")
    .select("id, book_id")
    .eq("id", userBookId)
    .eq("user_id", userId)
    .maybeSingle();
  if (e0) throw e0;
  if (!ub?.book_id) {
    throw new Error("Not found");
  }
  const { error } = await supabase
    .from("book_one_liners")
    .delete()
    .eq("user_id", userId)
    .eq("book_id", ub.book_id as string);
  if (error) throw error;
}

export async function listUserBookReadingEvents(
  userBookId: string,
  context: RepositoryContext,
): Promise<ReadingEventRow[]> {
  const { supabase, userId } = getAdminContext(context);
  const { data: ub, error: e0 } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", userBookId)
    .eq("user_id", userId)
    .maybeSingle();
  if (e0) throw e0;
  if (!ub) {
    return [];
  }
  const { data, error } = await supabase
    .from("user_book_reading_events")
    .select("id, user_book_id, event_type, payload, occurred_at, created_at")
    .eq("user_book_id", userBookId)
    .order("occurred_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    userBookId: r.user_book_id as string,
    eventType: r.event_type as ReadingEventType,
    payload: (r.payload as Record<string, unknown>) ?? {},
    occurredAt: r.occurred_at as string,
    createdAt: r.created_at as string,
  }));
}

export async function appendUserBookReadingEvent(
  userBookId: string,
  eventType: ReadingEventType,
  payload: Record<string, unknown>,
  context: RepositoryContext,
  opts?: { setReadingStatus?: ReadingStatus; occurredAt?: string },
): Promise<ReadingEventRow> {
  const { supabase, userId } = getAdminContext(context);
  const { data: ub, error: e0 } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", userBookId)
    .eq("user_id", userId)
    .maybeSingle();
  if (e0) throw e0;
  if (!ub) {
    throw new Error("Not found");
  }
  if (opts?.setReadingStatus) {
    const { error: uErr } = await supabase
      .from("user_books")
      .update({ reading_status: opts.setReadingStatus })
      .eq("id", userBookId)
      .eq("user_id", userId);
    if (uErr) throw uErr;
  }
  const insertRow = {
    user_book_id: userBookId,
    event_type: eventType,
    payload: payload ?? {},
    occurred_at: opts?.occurredAt ?? new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("user_book_reading_events")
    .insert(insertRow)
    .select("id, user_book_id, event_type, payload, occurred_at, created_at")
    .single();
  if (error) throw error;
  const r = data as Record<string, unknown>;
  try {
    await tryRecordDailyActivityCheckIn(supabase, userId);
  } catch (e) {
    console.error("tryRecordDailyActivityCheckIn", e);
  }
  return {
    id: r.id as string,
    userBookId: r.user_book_id as string,
    eventType: r.event_type as ReadingEventType,
    payload: (r.payload as Record<string, unknown>) ?? {},
    occurredAt: r.occurred_at as string,
    createdAt: r.created_at as string,
  };
}

export function parseLeaderboardPayload(
  raw: unknown,
): ReadingLeaderboardResponse {
  let o = raw;
  if (typeof o === "string") {
    try {
      o = JSON.parse(o) as unknown;
    } catch {
      return { top: [], me: { rank: null, count: 0, totalRankedUsers: 0 } };
    }
  }
  if (!o || typeof o !== "object") {
    return { top: [], me: { rank: null, count: 0, totalRankedUsers: 0 } };
  }
  const rec = o as Record<string, unknown>;
  const topRaw = rec.top;
  const meRaw = rec.me;
  const top = Array.isArray(topRaw)
    ? topRaw.map((x) => {
        const t = x as Record<string, unknown>;
        return {
          userId: String(t.userId ?? ""),
          displayName: (t.displayName as string | null) ?? null,
          count: Number(t.count ?? 0),
        };
      })
    : [];
  const meRec =
    meRaw && typeof meRaw === "object" && !Array.isArray(meRaw)
      ? (meRaw as Record<string, unknown>)
      : {};
  const rankVal = meRec.rank;
  return {
    top,
    me: {
      rank: rankVal === null || rankVal === undefined ? null : Number(rankVal),
      count: Number(meRec.count ?? 0),
      totalRankedUsers: Number(meRec.totalRankedUsers ?? 0),
    },
  };
}

export async function getReadingLeaderboard(
  kind: "completed" | "owned",
  topN: number,
  context: RepositoryContext,
): Promise<ReadingLeaderboardResponse> {
  const { supabase, userId } = getAdminContext(context);
  const { data, error } = await supabase.rpc("reading_leaderboard", {
    p_user_id: userId,
    p_kind: kind,
    p_top_n: topN,
  });
  if (error) throw error;
  return parseLeaderboardPayload(data);
}

export async function getReadingEventsCalendar(
  from: string,
  to: string,
  context: RepositoryContext,
): Promise<Record<string, number>> {
  const { supabase, userId } = getAdminContext(context);
  const { data, error } = await supabase.rpc("user_reading_events_calendar", {
    p_user_id: userId,
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    const n = Number(v);
    if (Number.isFinite(n)) {
      out[k] = n;
    }
  }
  return out;
}

export type ReadingEventDayListItem = {
  id: string;
  userBookId: string;
  eventType: ReadingEventType;
  occurredAt: string;
  title: string;
  authorsLine: string;
  coverUrl: string | null;
};

/** `user_reading_events_calendar` RPC과 동일하게 UTC 달력일 기준으로 경계를 둡니다. */
function utcDayRangeIso(dayYmd: string): {
  startIso: string;
  endExclusiveIso: string;
} {
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
 * 특정 UTC 달력일의 독서 이벤트 목록(도서 표지·제목·저자 포함).
 *
 * @history
 * - 2026-03-26: 신규 — 대시보드 캘린더 일별 상세(`/api/me/reading-events/by-day`)
 */
export async function listReadingEventsForUtcDayWithBooks(
  dayYmd: string,
  context: RepositoryContext,
): Promise<ReadingEventDayListItem[]> {
  const { supabase, userId } = getAdminContext(context);
  const { startIso, endExclusiveIso } = utcDayRangeIso(dayYmd);
  const { data, error } = await supabase
    .from("user_book_reading_events")
    .select(
      `
      id,
      user_book_id,
      event_type,
      occurred_at,
      user_books!inner (
        user_id,
        books!inner (
          title,
          authors,
          cover_url
        )
      )
    `,
    )
    .eq("user_books.user_id", userId)
    .gte("occurred_at", startIso)
    .lt("occurred_at", endExclusiveIso)
    .order("occurred_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const out: ReadingEventDayListItem[] = [];
  for (const raw of rows) {
    const r = raw as Record<string, unknown>;
    const ub = r.user_books as Record<string, unknown> | undefined;
    const bk = ub?.books as Record<string, unknown> | undefined;
    if (!ub || !bk) {
      continue;
    }
    const authorsRaw = bk.authors;
    const authors = Array.isArray(authorsRaw)
      ? authorsRaw.filter((x): x is string => typeof x === "string")
      : [];
    out.push({
      id: String(r.id ?? ""),
      userBookId: String(r.user_book_id ?? ""),
      eventType: r.event_type as ReadingEventType,
      occurredAt: String(r.occurred_at ?? ""),
      title: String(bk.title ?? ""),
      authorsLine: authors.join(", "),
      coverUrl: typeof bk.cover_url === "string" ? bk.cover_url : null,
    });
  }
  return out;
}
