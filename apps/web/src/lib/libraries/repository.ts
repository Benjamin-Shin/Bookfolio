import {
  mergeAppUserPolicies,
  type BookFormat,
  type CreateLibraryInput,
  type CreateUserBookInput,
  type LibraryAggregatedBookRow,
  type LibraryMemberRow,
  type LibraryMemberRole,
  type LibrarySharedOwnerRow,
  type LibrarySummary,
  type ReadingStatus,
  type ShareToLibraryInput,
  type UpdateLibraryInput
} from "@bookfolio/shared";

import {
  createUserBook,
  updateUserBook,
  UserBookAlreadyInShelfError,
  type DbCanonicalBook,
  type RepositoryContext
} from "@/lib/books/repository";
import { normalizeCoverUrlForClient } from "@/lib/books/cover-url";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { SharedLibraryCreateLimitReachedError } from "@/lib/libraries/shared-library-policy";
import type { SupabaseClient } from "@supabase/supabase-js";

type DbLibraryRow = {
  id: string;
  name: string;
  description: string | null;
  kind: LibrarySummary["kind"];
  created_by: string;
  created_at: string;
  updated_at: string;
};

type DbLibraryMemberRow = {
  role: LibraryMemberRole;
  libraries: DbLibraryRow | DbLibraryRow[];
};

async function getClient(context?: RepositoryContext) {
  return createSupabaseAdminClient();
}

async function countLibrariesCreatedBy(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("libraries")
    .select("id", { count: "exact", head: true })
    .eq("created_by", userId);
  if (error) {
    throw error;
  }
  return count ?? 0;
}

/**
 * `libraries.created_by` 기준, 해당 사용자가 소유자로 만든 공동서재 개수.
 *
 * @history
 * - 2026-03-25: `policies_json.sharedLibraryCreateLimit` 검증·UI용
 */
export async function countLibrariesCreatedByUser(
  userId: string,
  context?: RepositoryContext
): Promise<number> {
  const supabase = await getClient(context);
  return countLibrariesCreatedBy(supabase, userId);
}

async function getMemberRole(
  supabase: SupabaseClient,
  libraryId: string,
  userId: string
): Promise<LibraryMemberRole | null> {
  const { data, error } = await supabase
    .from("library_members")
    .select("role")
    .eq("library_id", libraryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  const role = data?.role;
  if (role === "owner" || role === "member") {
    return role;
  }
  return null;
}

export async function assertLibraryMember(
  libraryId: string,
  userId: string,
  context?: RepositoryContext
): Promise<LibraryMemberRole> {
  const supabase = await getClient(context);
  const role = await getMemberRole(supabase, libraryId, userId);
  if (!role) {
    throw new Error("공동서재에 접근할 권한이 없습니다.");
  }
  return role;
}

export async function assertLibraryOwner(
  libraryId: string,
  userId: string,
  context?: RepositoryContext
): Promise<void> {
  const role = await assertLibraryMember(libraryId, userId, context);
  if (role !== "owner") {
    throw new Error("소유자만 할 수 있는 작업입니다.");
  }
}

function mapLibraryRow(row: DbLibraryRow, myRole: LibraryMemberRole): LibrarySummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    kind: row.kind,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    myRole
  };
}

export async function listLibrariesForUser(
  userId: string,
  context?: RepositoryContext
): Promise<LibrarySummary[]> {
  const supabase = await getClient(context);
  const { data, error } = await supabase
    .from("library_members")
    .select(
      `
      role,
      libraries (
        id,
        name,
        description,
        kind,
        created_by,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", userId);

  if (error) throw error;
  const rows = (data ?? []) as unknown as DbLibraryMemberRow[];
  return rows
    .map((r) => {
      const lib = Array.isArray(r.libraries) ? r.libraries[0] : r.libraries;
      if (!lib) return null;
      return mapLibraryRow(lib, r.role);
    })
    .filter((x): x is LibrarySummary => x !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * @history
 * - 2026-03-25: `app_users.policies_json.sharedLibraryCreateLimit` 만큼만 생성 허용
 */
export async function createLibrary(
  input: CreateLibraryInput,
  userId: string,
  context?: RepositoryContext
): Promise<LibrarySummary> {
  const supabase = await getClient(context);
  const name = input.name.trim();
  if (!name) {
    throw new Error("이름을 입력해 주세요.");
  }

  const [{ data: policyRow }, createdCount] = await Promise.all([
    supabase.from("app_users").select("policies_json").eq("id", userId).maybeSingle(),
    countLibrariesCreatedBy(supabase, userId)
  ]);
  const policies = mergeAppUserPolicies(policyRow?.policies_json);
  if (createdCount >= policies.sharedLibraryCreateLimit) {
    throw new SharedLibraryCreateLimitReachedError(policies.sharedLibraryCreateLimit, createdCount);
  }

  const { data: lib, error: libErr } = await supabase
    .from("libraries")
    .insert({
      name,
      description: input.description?.trim() ? input.description.trim() : null,
      kind: input.kind,
      created_by: userId
    })
    .select("id, name, description, kind, created_by, created_at, updated_at")
    .single();

  if (libErr) throw libErr;
  const row = lib as DbLibraryRow;

  const { error: memErr } = await supabase.from("library_members").insert({
    library_id: row.id,
    user_id: userId,
    role: "owner",
    joined_at: new Date().toISOString()
  });

  if (memErr) throw memErr;

  await linkAllUserBooksToLibrary(supabase, row.id, userId);

  return mapLibraryRow(row, "owner");
}

/** 공동서재 목록은 매핑된 user_books만 보이므로, 소유자 개인 서재 전체를 서재 생성 시 자동 연결한다. */
async function linkAllUserBooksToLibrary(
  supabase: SupabaseClient,
  libraryId: string,
  ownerUserId: string
): Promise<void> {
  const { data: ubRows, error: ubErr } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", ownerUserId);

  if (ubErr) throw ubErr;
  const ids = (ubRows ?? []).map((r) => r.id as string);
  if (ids.length === 0) {
    return;
  }

  const now = new Date().toISOString();
  const payload = ids.map((userBookId) => ({
    library_id: libraryId,
    user_book_id: userBookId,
    linked_by: ownerUserId,
    linked_at: now
  }));

  const chunkSize = 200;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error: linkErr } = await supabase.from("library_user_books").insert(chunk);
    if (linkErr) throw linkErr;
  }
}

/** 개인 서재에 책을 새로 넣었을 때, 내가 속한 모든 공동서재(소유자·멤버)에 동일 매핑을 둔다. */
export async function linkUserBookToOwnedLibraries(
  userBookId: string,
  userId: string,
  context?: RepositoryContext
): Promise<void> {
  const supabase = await getClient(context);
  const { data: libs, error } = await supabase
    .from("library_members")
    .select("library_id")
    .eq("user_id", userId);

  if (error) throw error;
  const libraryIds = [...new Set((libs ?? []).map((r) => r.library_id as string))];
  if (libraryIds.length === 0) {
    return;
  }

  const now = new Date().toISOString();
  const payload = libraryIds.map((libraryId) => ({
    library_id: libraryId,
    user_book_id: userBookId,
    linked_by: userId,
    linked_at: now
  }));

  const { error: upErr } = await supabase.from("library_user_books").upsert(payload, {
    onConflict: "library_id,user_book_id",
    ignoreDuplicates: true
  });
  if (upErr) throw upErr;
}

export async function getLibrary(
  libraryId: string,
  userId: string,
  context?: RepositoryContext
): Promise<LibrarySummary | null> {
  const supabase = await getClient(context);
  const role = await getMemberRole(supabase, libraryId, userId);
  if (!role) {
    return null;
  }

  const { data, error } = await supabase
    .from("libraries")
    .select("id, name, description, kind, created_by, created_at, updated_at")
    .eq("id", libraryId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapLibraryRow(data as DbLibraryRow, role);
}

export async function updateLibrary(
  libraryId: string,
  input: UpdateLibraryInput,
  userId: string,
  context?: RepositoryContext
): Promise<LibrarySummary> {
  await assertLibraryOwner(libraryId, userId, context);
  const supabase = await getClient(context);

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const n = input.name.trim();
    if (!n) throw new Error("이름을 입력해 주세요.");
    patch.name = n;
  }
  if (input.description !== undefined) {
    patch.description = input.description?.trim() ? input.description.trim() : null;
  }
  if (input.kind !== undefined) {
    patch.kind = input.kind;
  }

  if (Object.keys(patch).length === 0) {
    const cur = await getLibrary(libraryId, userId, context);
    if (!cur) throw new Error("Not found");
    return cur;
  }

  const { data, error } = await supabase
    .from("libraries")
    .update(patch)
    .eq("id", libraryId)
    .select("id, name, description, kind, created_by, created_at, updated_at")
    .single();

  if (error) throw error;
  return mapLibraryRow(data as DbLibraryRow, "owner");
}

export async function deleteLibrary(
  libraryId: string,
  userId: string,
  context?: RepositoryContext
): Promise<void> {
  await assertLibraryOwner(libraryId, userId, context);
  const supabase = await getClient(context);
  const { error } = await supabase.from("libraries").delete().eq("id", libraryId);
  if (error) throw error;
}

export async function listLibraryMembers(
  libraryId: string,
  userId: string,
  context?: RepositoryContext
): Promise<LibraryMemberRow[]> {
  await assertLibraryMember(libraryId, userId, context);
  const supabase = await getClient(context);

  const { data, error } = await supabase
    .from("library_members")
    .select("user_id, role, joined_at")
    .eq("library_id", libraryId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) {
    return [];
  }

  const ids = rows.map((r) => r.user_id as string);
  const { data: users, error: uErr } = await supabase
    .from("app_users")
    .select("id, email, name")
    .in("id", ids);

  if (uErr) throw uErr;
  const byId = new Map((users ?? []).map((u) => [u.id as string, u]));

  return rows.map((r) => {
    const u = byId.get(r.user_id as string);
    return {
      userId: r.user_id as string,
      email: (u?.email as string) ?? "",
      name: (u?.name as string | null) ?? null,
      role: r.role as LibraryMemberRole,
      joinedAt: r.joined_at as string
    };
  });
}

export async function addLibraryMemberByEmail(
  libraryId: string,
  emailRaw: string,
  actorUserId: string,
  context?: RepositoryContext
): Promise<LibraryMemberRow> {
  await assertLibraryOwner(libraryId, actorUserId, context);
  const supabase = await getClient(context);
  const email = emailRaw.trim().toLowerCase();
  if (!email) {
    throw new Error("이메일을 입력해 주세요.");
  }

  const { data: userRow, error: userErr } = await supabase
    .from("app_users")
    .select("id, email, name")
    .ilike("email", email)
    .maybeSingle();

  if (userErr) throw userErr;
  if (!userRow) {
    throw new Error("해당 이메일로 가입한 사용자를 찾을 수 없습니다.");
  }

  const targetId = userRow.id as string;
  if (targetId === actorUserId) {
    throw new Error("이미 이 서재의 멤버입니다.");
  }

  const { error: insErr } = await supabase.from("library_members").insert({
    library_id: libraryId,
    user_id: targetId,
    role: "member",
    joined_at: new Date().toISOString()
  });

  if (insErr) {
    if (insErr.code === "23505") {
      throw new Error("이미 이 서재의 멤버입니다.");
    }
    throw insErr;
  }

  await linkAllUserBooksToLibrary(supabase, libraryId, targetId);

  return {
    userId: targetId,
    email: userRow.email as string,
    name: (userRow.name as string | null) ?? null,
    role: "member",
    joinedAt: new Date().toISOString()
  };
}

export async function removeLibraryMember(
  libraryId: string,
  targetUserId: string,
  actorUserId: string,
  context?: RepositoryContext
): Promise<void> {
  const supabase = await getClient(context);
  const actorRole = await getMemberRole(supabase, libraryId, actorUserId);
  if (!actorRole) {
    throw new Error("공동서재에 접근할 권한이 없습니다.");
  }

  if (targetUserId !== actorUserId) {
    if (actorRole !== "owner") {
      throw new Error("소유자만 다른 멤버를 제거할 수 있습니다.");
    }
  }

  const { data: targetRow, error: tErr } = await supabase
    .from("library_members")
    .select("role")
    .eq("library_id", libraryId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (tErr) throw tErr;
  if (!targetRow) {
    throw new Error("멤버를 찾을 수 없습니다.");
  }

  if (targetRow.role === "owner") {
    throw new Error("소유자는 멤버 목록에서 제거할 수 없습니다. 서재를 삭제하세요.");
  }

  const { data: targetBooks, error: tbErr } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", targetUserId);

  if (tbErr) throw tbErr;
  const targetUserBookIds = (targetBooks ?? []).map((r) => r.id as string);
  if (targetUserBookIds.length > 0) {
    const { error: lubErr } = await supabase
      .from("library_user_books")
      .delete()
      .eq("library_id", libraryId)
      .in("user_book_id", targetUserBookIds);
    if (lubErr) throw lubErr;
  }

  const { error: delErr } = await supabase
    .from("library_members")
    .delete()
    .eq("library_id", libraryId)
    .eq("user_id", targetUserId);

  if (delErr) throw delErr;
}

type LinkedLibraryRow = {
  user_book_id: string;
  linked_at: string;
  linked_by: string | null;
  user_books: {
    id: string;
    user_id: string;
    book_id: string;
    reading_status: string;
    memo: string | null;
    location: string | null;
    updated_at: string;
    books: DbCanonicalBook | DbCanonicalBook[];
  };
};

function pickBookFromNested(ub: LinkedLibraryRow["user_books"]): DbCanonicalBook | null {
  const b = ub.books;
  if (!b) return null;
  return Array.isArray(b) ? b[0] ?? null : b;
}

type FlatLinked = {
  userBookId: string;
  linkedAt: string;
  userId: string;
  bookId: string;
  readingStatus: ReadingStatus;
  memo: string | null;
  location: string | null;
  book: DbCanonicalBook;
};

function flattenLinkedRows(rows: LinkedLibraryRow[]): FlatLinked[] {
  const out: FlatLinked[] = [];
  for (const r of rows) {
    const book = pickBookFromNested(r.user_books);
    if (!book) continue;
    const st = r.user_books.reading_status;
    const rs: ReadingStatus =
      st === "unread" || st === "reading" || st === "completed" || st === "paused" || st === "dropped"
        ? st
        : "unread";
    out.push({
      userBookId: r.user_book_id,
      linkedAt: r.linked_at,
      userId: r.user_books.user_id,
      bookId: r.user_books.book_id,
      readingStatus: rs,
      memo: r.user_books.memo,
      location: r.user_books.location,
      book
    });
  }
  return out;
}

/**
 * `book_id`별 소유자 묶음 → 집계 행.
 *
 * @history
 * - 2026-03-24: 공유 서지 `genre_slugs`를 `genreSlugs`로 노출
 */
function buildAggregatedList(
  libraryId: string,
  flat: FlatLinked[],
  profiles: Map<string, { email: string; name: string | null }>
): LibraryAggregatedBookRow[] {
  const byBook = new Map<string, FlatLinked[]>();
  for (const f of flat) {
    if (!byBook.has(f.bookId)) byBook.set(f.bookId, []);
    byBook.get(f.bookId)!.push(f);
  }

  const result: LibraryAggregatedBookRow[] = [];
  for (const [bookIdKey, group] of byBook) {
    const book = group[0].book;
    const byUser = new Map<string, FlatLinked>();
    for (const g of group) {
      const prev = byUser.get(g.userId);
      if (!prev || g.linkedAt > prev.linkedAt) {
        byUser.set(g.userId, g);
      }
    }
    const owners: LibrarySharedOwnerRow[] = [...byUser.values()].map((g) => {
      const p = profiles.get(g.userId);
      return {
        userId: g.userId,
        email: p?.email ?? "",
        name: p?.name ?? null,
        userBookId: g.userBookId,
        readingStatus: g.readingStatus,
        location: g.location,
        memo: g.memo,
        linkedAt: g.linkedAt
      };
    });
    owners.sort((a, b) => a.linkedAt.localeCompare(b.linkedAt));
    const updatedAt = owners.reduce((m, o) => (o.linkedAt > m ? o.linkedAt : m), owners[0]?.linkedAt ?? "");
    const rawGenres = Array.isArray(book.genre_slugs) ? book.genre_slugs : [];
    const genreSlugs = rawGenres.map((x) => String(x).trim()).filter(Boolean);
    result.push({
      libraryId,
      bookId: bookIdKey,
      isbn: book.isbn,
      title: book.title,
      authors: Array.isArray(book.authors) ? book.authors : [],
      coverUrl: normalizeCoverUrlForClient(book.cover_url),
      genreSlugs: genreSlugs.length > 0 ? genreSlugs : undefined,
      owners,
      updatedAt
    });
  }

  result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return result;
}

async function fetchLinkedRowsForLibrary(
  supabase: SupabaseClient,
  libraryId: string
): Promise<LinkedLibraryRow[]> {
  const { data, error } = await supabase
    .from("library_user_books")
    .select(
      `
      user_book_id,
      linked_at,
      linked_by,
      user_books!inner (
        id,
        user_id,
        book_id,
        reading_status,
        memo,
        location,
        updated_at,
        books!inner (
          id,
          isbn,
          title,
          authors,
          publisher,
          published_date,
          cover_url,
          description,
          price_krw,
          source,
          genre_slugs,
          literature_region,
          original_language,
          created_at,
          updated_at
        )
      )
    `
    )
    .eq("library_id", libraryId);

  if (error) throw error;
  return (data ?? []) as unknown as LinkedLibraryRow[];
}

async function loadProfilesForUserIds(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, { email: string; name: string | null }>> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) {
    return new Map();
  }
  const { data, error } = await supabase.from("app_users").select("id, email, name").in("id", unique);
  if (error) throw error;
  return new Map(
    (data ?? []).map((u) => [
      u.id as string,
      { email: (u.email as string) ?? "", name: (u.name as string | null) ?? null }
    ])
  );
}

export async function listLibraryBooks(
  libraryId: string,
  userId: string,
  context?: RepositoryContext
): Promise<LibraryAggregatedBookRow[]> {
  await assertLibraryMember(libraryId, userId, context);
  const supabase = await getClient(context);
  const rows = await fetchLinkedRowsForLibrary(supabase, libraryId);
  const flat = flattenLinkedRows(rows);
  const profiles = await loadProfilesForUserIds(
    supabase,
    flat.map((f) => f.userId)
  );
  return buildAggregatedList(libraryId, flat, profiles);
}

export async function getLibraryAggregatedBook(
  libraryId: string,
  bookId: string,
  userId: string,
  context?: RepositoryContext
): Promise<LibraryAggregatedBookRow | null> {
  await assertLibraryMember(libraryId, userId, context);
  const supabase = await getClient(context);
  const rows = await fetchLinkedRowsForLibrary(supabase, libraryId);
  const flat = flattenLinkedRows(rows).filter((f) => f.bookId === bookId);
  if (flat.length === 0) {
    return null;
  }
  const profiles = await loadProfilesForUserIds(
    supabase,
    flat.map((f) => f.userId)
  );
  return buildAggregatedList(libraryId, flat, profiles)[0] ?? null;
}

export async function shareBookToLibrary(
  libraryId: string,
  input: ShareToLibraryInput,
  userId: string,
  context?: RepositoryContext
): Promise<LibraryAggregatedBookRow> {
  await assertLibraryMember(libraryId, userId, context);
  const supabase = await getClient(context);

  let userBookIdToLink: string;
  /** 공동서재 폼으로 새 user_books를 만든 경우에만, 내가 속한 다른 공동서재에도 같은 매핑을 둔다. */
  let propagateNewBookToOwnedLibraries = false;

  if ("userBookId" in input && input.userBookId) {
    const { data: ub, error } = await supabase
      .from("user_books")
      .select("id")
      .eq("id", input.userBookId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!ub) {
      throw new Error("내 서재에서 책을 찾을 수 없습니다.");
    }
    userBookIdToLink = ub.id as string;
  } else if ("bookId" in input && input.bookId) {
    const { data: ub, error } = await supabase
      .from("user_books")
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", input.bookId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!ub) {
      throw new Error("개인 서재에 해당 책이 없습니다. 먼저 개인 서재에 추가해 주세요.");
    }
    userBookIdToLink = ub.id as string;
    if (input.location !== undefined || input.memo !== undefined) {
      await updateUserBook(
        userBookIdToLink,
        {
          ...(input.location !== undefined ? { location: input.location } : {}),
          ...(input.memo !== undefined ? { memo: input.memo } : {})
        },
        { userId, useAdmin: true }
      );
    }
  } else {
    const manual = input as Pick<
      CreateUserBookInput,
      "isbn" | "title" | "authors" | "publisher" | "publishedDate" | "coverUrl" | "description" | "priceKrw"
    > & { format?: BookFormat; location?: string | null; memo?: string | null };
    if (!manual.title?.trim()) {
      throw new Error("제목을 입력해 주세요.");
    }
    if (!manual.authors?.length) {
      throw new Error("저자를 한 명 이상 입력해 주세요.");
    }
    try {
      const created = await createUserBook(
        {
          isbn: manual.isbn ?? null,
          title: manual.title.trim(),
          authors: manual.authors,
          publisher: manual.publisher ?? null,
          publishedDate: manual.publishedDate ?? null,
          coverUrl: manual.coverUrl ?? null,
          description: manual.description ?? null,
          priceKrw: manual.priceKrw ?? null,
          format: manual.format ?? "paper",
          location: manual.location?.trim() ? manual.location.trim() : null,
          memo: manual.memo?.trim() ? manual.memo.trim() : null
        },
        { userId, useAdmin: true }
      );
      userBookIdToLink = created.id;
      propagateNewBookToOwnedLibraries = true;
    } catch (e) {
      if (e instanceof UserBookAlreadyInShelfError) {
        userBookIdToLink = e.existingUserBookId;
        if (manual.location !== undefined || manual.memo !== undefined) {
          await updateUserBook(
            userBookIdToLink,
            {
              ...(manual.location !== undefined
                ? { location: manual.location?.trim() ? manual.location.trim() : null }
                : {}),
              ...(manual.memo !== undefined
                ? { memo: manual.memo?.trim() ? manual.memo.trim() : null }
                : {})
            },
            { userId, useAdmin: true }
          );
        }
      } else {
        throw e;
      }
    }
  }

  const { error: insErr } = await supabase.from("library_user_books").insert({
    library_id: libraryId,
    user_book_id: userBookIdToLink,
    linked_by: userId,
    linked_at: new Date().toISOString()
  });

  if (insErr) {
    if (insErr.code === "23505") {
      throw new Error("이미 이 서재에 올린 책입니다.");
    }
    throw insErr;
  }

  if (propagateNewBookToOwnedLibraries) {
    await linkUserBookToOwnedLibraries(userBookIdToLink, userId, context);
  }

  const { data: ubRow, error: ubErr } = await supabase
    .from("user_books")
    .select("book_id")
    .eq("id", userBookIdToLink)
    .single();
  if (ubErr) throw ubErr;
  const bid = ubRow?.book_id as string;
  const agg = await getLibraryAggregatedBook(libraryId, bid, userId, context);
  if (!agg) {
    throw new Error("추가한 책을 다시 불러오지 못했습니다.");
  }
  return agg;
}

export async function unlinkMyBookFromSharedLibrary(
  libraryId: string,
  bookId: string,
  userId: string,
  context?: RepositoryContext
): Promise<void> {
  await assertLibraryMember(libraryId, userId, context);
  const supabase = await getClient(context);

  const { data: ubs, error: uErr } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", bookId);

  if (uErr) throw uErr;
  const ids = (ubs ?? []).map((r) => r.id as string);
  if (ids.length === 0) {
    return;
  }

  const { error: delErr } = await supabase
    .from("library_user_books")
    .delete()
    .eq("library_id", libraryId)
    .in("user_book_id", ids);

  if (delErr) throw delErr;
}

export async function updateMySharedLibraryReadingStatus(
  libraryId: string,
  bookId: string,
  readingStatus: ReadingStatus,
  userId: string,
  context?: RepositoryContext
): Promise<LibraryAggregatedBookRow> {
  await assertLibraryMember(libraryId, userId, context);
  const supabase = await getClient(context);

  const { data: ubs, error: uErr } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", bookId);

  if (uErr) throw uErr;
  const myIds = (ubs ?? []).map((r) => r.id as string);
  if (myIds.length === 0) {
    throw new Error("이 책에 대한 내 소장 정보가 없습니다.");
  }

  const { data: mapped, error: mErr } = await supabase
    .from("library_user_books")
    .select("user_book_id")
    .eq("library_id", libraryId)
    .in("user_book_id", myIds);

  if (mErr) throw mErr;
  const linked = new Set((mapped ?? []).map((x) => x.user_book_id as string));
  const targetIds = myIds.filter((id) => linked.has(id));
  if (targetIds.length === 0) {
    throw new Error("이 서재에 올리지 않은 책입니다.");
  }

  const now = new Date().toISOString();
  const { error: upErr } = await supabase
    .from("user_books")
    .update({ reading_status: readingStatus, updated_at: now })
    .eq("user_id", userId)
    .in("id", targetIds);

  if (upErr) throw upErr;

  const agg = await getLibraryAggregatedBook(libraryId, bookId, userId, context);
  if (!agg) {
    throw new Error("Not found");
  }
  return agg;
}
