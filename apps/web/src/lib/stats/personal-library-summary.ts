import { createSupabaseAdminClient } from "@/lib/supabase/server";

import type { RepositoryContext } from "@/lib/books/repository";

export type PersonalLibraryAuthorTop = {
  name: string;
  count: number;
};

/**
 * 통계 API에 넘길 수 있는 인구통계(공개 동의한 값만).
 *
 * @history
 * - 2026-04-02: `app_profiles` 공개 플래그 연동
 */
export type PersonalLibraryProfileForStats = {
  gender: string | null;
  birthYear: number | null;
};

export type PersonalLibrarySummary = {
  /** `user_books` 행 수(종이책만). */
  physicalPaperCount: number;
  /** 시리즈 등 제목 정규화 후 고유 그룹 수(휴리스틱). */
  ownedWorkCount: number;
  /** 읽는 중 상태인 종이책 권수. */
  readingPaperCount: number;
  completedCount: number;
  unreadCount: number;
  /** DB에 별도 플래그가 없어 `rating === 5` 완독을 인생책으로 집계. */
  lifeBookCount: number;
  /** 캐논 `price_krw` 합(소장이고 값이 있는 행만). */
  totalListPriceKrw: number;
  memoCount: number;
  oneLinerCount: number;
  /** 해당 연도에 `read_complete` 이벤트가 발생한 서로 다른 `user_book` 수. */
  readCompleteThisYearCount: number;
  readCompleteThisMonthCount: number;
  /** 완독 종이책의 `books.page_count` 합(값 없는 권은 제외). */
  totalPagesRead: number;
  /** 소장 종이책 기준, `books.authors` 첫 저자마다 권수를 세어 상위 3명. */
  topAuthorsByOwnedCount: PersonalLibraryAuthorTop[];
  /** 서버가 통계에 쓸 수 있는 본인 프로필 스냅샷(공개 항목만). */
  profileForStats: PersonalLibraryProfileForStats;
};

/**
 * 제목 기반 시리즈 그룹 키(휴리스틱). 동일 시리즈 권수를 1작품으로 근사할 때 사용.
 *
 * @history
 * - 2026-04-02: 모바일 「내 서가 분석」 소장 작품 수 집계용
 */
export function normalizeWorkTitleKey(title: string): string {
  let t = title.toLowerCase().trim();
  t = t.replace(/\s*[\u0028\uFF08]\s*\d+\s*[\u0029\uFF09]\s*$/u, "");
  t = t.replace(/\s*\d+\s*권\s*$/u, "");
  t = t.replace(/\s*#\s*\d+\s*$/u, "");
  return t.trim() || title.toLowerCase().trim();
}

function getAdminContext(context: RepositoryContext) {
  return { supabase: createSupabaseAdminClient(), userId: context.userId };
}

/**
 * 종이책 서가 기준 개인 요약 지표(모바일 허브·분석 화면).
 *
 * @history
 * - 2026-04-02: `topAuthorsByOwnedCount`, `profileForStats` 추가
 * - 2026-04-02: 신규 — `GET /api/me/stats/personal-library-summary`
 */
export async function getPersonalLibrarySummary(
  context: RepositoryContext,
): Promise<PersonalLibrarySummary> {
  const { supabase, userId } = getAdminContext(context);

  const { data: profRow } = await supabase
    .from("app_profiles")
    .select("gender, birth_date, gender_public, birth_date_public")
    .eq("id", userId)
    .maybeSingle();

  const prof = profRow as Record<string, unknown> | null;
  const profileForStats: PersonalLibraryProfileForStats = {
    gender:
      prof?.gender_public === true &&
      typeof prof?.gender === "string" &&
      prof.gender.trim()
        ? (prof.gender as string).trim()
        : null,
    birthYear: null,
  };
  if (prof?.birth_date_public === true && prof?.birth_date != null) {
    const raw = prof.birth_date as string;
    const y = parseInt(raw.slice(0, 4), 10);
    if (Number.isFinite(y) && y >= 1900 && y <= 2100) {
      profileForStats.birthYear = y;
    }
  }

  const { data: rows, error: ubErr } = await supabase
    .from("user_books")
    .select(
      `
      id,
      book_id,
      reading_status,
      rating,
      is_owned,
      books!inner (
        format,
        title,
        authors,
        page_count,
        price_krw
      )
    `,
    )
    .eq("user_id", userId)
    .eq("books.format", "paper");

  if (ubErr) {
    throw ubErr;
  }

  const list = rows ?? [];
  const authorHits = new Map<string, number>();
  const workKeys = new Set<string>();
  let readingPaperCount = 0;
  let completedCount = 0;
  let unreadCount = 0;
  let lifeBookCount = 0;
  let totalListPriceKrw = 0;
  let totalPagesRead = 0;

  for (const raw of list) {
    const r = raw as Record<string, unknown>;
    const bk = r.books as Record<string, unknown> | undefined;
    const title = typeof bk?.title === "string" ? bk.title : "";
    workKeys.add(normalizeWorkTitleKey(title));

    const authArr = bk?.authors;
    if (Array.isArray(authArr) && authArr.length > 0) {
      const primary = String(authArr[0] ?? "").trim();
      if (primary) {
        authorHits.set(primary, (authorHits.get(primary) ?? 0) + 1);
      }
    }

    const rs = r.reading_status;
    if (rs === "reading") {
      readingPaperCount += 1;
    } else if (rs === "completed") {
      completedCount += 1;
      const pc = bk?.page_count;
      if (typeof pc === "number" && Number.isFinite(pc) && pc > 0) {
        totalPagesRead += pc;
      }
      const rating = r.rating;
      if (rating === 5) {
        lifeBookCount += 1;
      }
    } else if (rs === "unread") {
      unreadCount += 1;
    }

    const owned = r.is_owned === true;
    const pk = bk?.price_krw;
    if (owned && typeof pk === "number" && Number.isFinite(pk) && pk > 0) {
      totalListPriceKrw += pk;
    }
  }

  const [{ count: memoCount }, { count: oneLinerCount }] = await Promise.all([
    supabase
      .from("user_book_memos")
      .select("id, user_books!inner(user_id)", { count: "exact", head: true })
      .eq("user_books.user_id", userId),
    supabase
      .from("book_one_liners")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const yearStart = `${y}-01-01T00:00:00.000Z`;
  const yearEnd = `${y + 1}-01-01T00:00:00.000Z`;
  const monthStart = `${y}-${String(m + 1).padStart(2, "0")}-01T00:00:00.000Z`;
  const nextMonth =
    m === 11
      ? `${y + 1}-01-01T00:00:00.000Z`
      : `${y}-${String(m + 2).padStart(2, "0")}-01T00:00:00.000Z`;

  const userBookIds = list.map((x) =>
    String((x as Record<string, unknown>).id),
  );

  async function distinctReadCompletes(
    fromIso: string,
    toIso: string,
  ): Promise<number> {
    if (userBookIds.length === 0) {
      return 0;
    }
    const { data: evs, error: evErr } = await supabase
      .from("user_book_reading_events")
      .select("user_book_id")
      .eq("event_type", "read_complete")
      .gte("occurred_at", fromIso)
      .lt("occurred_at", toIso)
      .in("user_book_id", userBookIds);
    if (evErr) {
      throw evErr;
    }
    const set = new Set<string>();
    for (const e of evs ?? []) {
      const row = e as Record<string, unknown>;
      const ub = row.user_book_id;
      if (typeof ub === "string") {
        set.add(ub);
      }
    }
    return set.size;
  }

  const [readCompleteThisYearCount, readCompleteThisMonthCount] =
    await Promise.all([
      distinctReadCompletes(yearStart, yearEnd),
      distinctReadCompletes(monthStart, nextMonth),
    ]);

  const topAuthorsByOwnedCount: PersonalLibraryAuthorTop[] = [
    ...authorHits.entries(),
  ]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ko"))
    .slice(0, 3);

  return {
    physicalPaperCount: list.length,
    ownedWorkCount: workKeys.size,
    readingPaperCount,
    completedCount,
    unreadCount,
    lifeBookCount,
    totalListPriceKrw,
    memoCount: memoCount ?? 0,
    oneLinerCount: oneLinerCount ?? 0,
    readCompleteThisYearCount,
    readCompleteThisMonthCount,
    totalPagesRead,
    topAuthorsByOwnedCount,
    profileForStats,
  };
}
