import type {
  CreateLibraryBookInput,
  CreateLibraryInput,
  LibraryBookDetail,
  LibraryBookSummary,
  LibraryMemberRow,
  LibraryMemberRole,
  LibrarySummary,
  ReadingStatus,
  UpdateLibraryBookInput,
  UpdateLibraryInput
} from "@bookfolio/shared";

import {
  getCanonicalBookById,
  resolveCanonicalBookForSharedLibrary,
  type DbCanonicalBook,
  type RepositoryContext
} from "@/lib/books/repository";
import { normalizeCoverUrlForClient } from "@/lib/books/cover-url";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
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

  return mapLibraryRow(row, "owner");
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

  const { error: delErr } = await supabase
    .from("library_members")
    .delete()
    .eq("library_id", libraryId)
    .eq("user_id", targetUserId);

  if (delErr) throw delErr;
}

function mapBookToLibrarySummary(
  lb: {
    id: string;
    library_id: string;
    book_id: string;
    location: string | null;
    memo: string | null;
    created_at: string;
    updated_at: string;
  },
  book: DbCanonicalBook
): LibraryBookSummary {
  return {
    id: lb.id,
    libraryId: lb.library_id,
    bookId: lb.book_id,
    isbn: book.isbn,
    title: book.title,
    authors: Array.isArray(book.authors) ? book.authors : [],
    coverUrl: normalizeCoverUrlForClient(book.cover_url),
    location: lb.location,
    memo: lb.memo,
    createdAt: lb.created_at,
    updatedAt: lb.updated_at
  };
}

export async function listLibraryBooks(
  libraryId: string,
  userId: string,
  context?: RepositoryContext
): Promise<LibraryBookSummary[]> {
  await assertLibraryMember(libraryId, userId, context);
  const supabase = await getClient(context);

  const { data, error } = await supabase
    .from("library_books")
    .select(
      `
      id,
      library_id,
      book_id,
      location,
      memo,
      created_at,
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
    `
    )
    .eq("library_id", libraryId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  type JoinedRow = {
    id: string;
    library_id: string;
    book_id: string;
    location: string | null;
    memo: string | null;
    created_at: string;
    updated_at: string;
    books: DbCanonicalBook | DbCanonicalBook[];
  };

  return (data ?? []).map((row: JoinedRow) => {
    const b = row.books;
    const book = Array.isArray(b) ? b[0] : b;
    if (!book) throw new Error("연결된 도서 정보를 찾을 수 없습니다.");
    return mapBookToLibrarySummary(row, book);
  });
}

export async function addLibraryBook(
  libraryId: string,
  input: CreateLibraryBookInput,
  userId: string,
  context?: RepositoryContext
): Promise<LibraryBookDetail> {
  await assertLibraryMember(libraryId, userId, context);
  const supabase = await getClient(context);

  let canonical: DbCanonicalBook;

  if ("bookId" in input && input.bookId) {
    const found = await getCanonicalBookById(input.bookId, { userId, useAdmin: true });
    if (!found) {
      throw new Error("카탈로그에서 도서를 찾을 수 없습니다.");
    }
    canonical = found;
  } else {
    const manual = input as Exclude<CreateLibraryBookInput, { bookId: string }>;
    if (!manual.title?.trim()) {
      throw new Error("제목을 입력해 주세요.");
    }
    canonical = await resolveCanonicalBookForSharedLibrary(supabase, {
      isbn: manual.isbn ?? null,
      title: manual.title,
      authors: manual.authors,
      publisher: manual.publisher ?? null,
      publishedDate: manual.publishedDate ?? null,
      coverUrl: manual.coverUrl ?? null,
      description: manual.description ?? null,
      priceKrw: manual.priceKrw ?? null
    });
  }

  const loc = input.location?.trim();
  const memo = input.memo?.trim();

  const { data: inserted, error } = await supabase
    .from("library_books")
    .insert({
      library_id: libraryId,
      book_id: canonical.id,
      location: loc ? loc : null,
      memo: memo ? memo : null,
      added_by: userId
    })
    .select("id")
    .single();

  if (error) throw error;

  const detail = await getLibraryBook(inserted.id as string, userId, context);
  if (!detail) {
    throw new Error("추가한 책을 다시 불러오지 못했습니다.");
  }
  return detail;
}

export async function getLibraryBook(
  libraryBookId: string,
  userId: string,
  context?: RepositoryContext
): Promise<LibraryBookDetail | null> {
  const supabase = await getClient(context);

  const { data: lb, error: lbErr } = await supabase
    .from("library_books")
    .select(
      `
      id,
      library_id,
      book_id,
      location,
      memo,
      created_at,
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
    `
    )
    .eq("id", libraryBookId)
    .maybeSingle();

  if (lbErr) throw lbErr;
  if (!lb) return null;

  const libraryId = lb.library_id as string;
  await assertLibraryMember(libraryId, userId, context);

  const b = lb.books as DbCanonicalBook | DbCanonicalBook[];
  const book = Array.isArray(b) ? b[0] : b;
  if (!book) throw new Error("연결된 도서 정보를 찾을 수 없습니다.");

  const summary = mapBookToLibrarySummary(lb, book);

  const members = await listLibraryMembers(libraryId, userId, context);

  const { data: states, error: stErr } = await supabase
    .from("library_book_member_states")
    .select("user_id, reading_status, updated_at")
    .eq("library_book_id", libraryBookId);

  if (stErr) throw stErr;

  const stateByUser = new Map(
    (states ?? []).map((s) => [
      s.user_id as string,
      { readingStatus: s.reading_status as ReadingStatus, updatedAt: s.updated_at as string }
    ])
  );

  const memberStates = members.map((m) => {
    const st = stateByUser.get(m.userId);
    return {
      userId: m.userId,
      email: m.email,
      name: m.name,
      readingStatus: st?.readingStatus ?? "unread",
      updatedAt: st?.updatedAt ?? m.joinedAt
    };
  });

  return {
    ...summary,
    memberStates
  };
}

export async function updateLibraryBook(
  libraryBookId: string,
  input: UpdateLibraryBookInput,
  userId: string,
  context?: RepositoryContext
): Promise<LibraryBookDetail> {
  const supabase = await getClient(context);
  const { data: lb, error: lbErr } = await supabase
    .from("library_books")
    .select("library_id")
    .eq("id", libraryBookId)
    .maybeSingle();

  if (lbErr) throw lbErr;
  if (!lb) {
    throw new Error("Not found");
  }

  await assertLibraryMember(lb.library_id as string, userId, context);

  const patch: Record<string, unknown> = {};
  if (input.location !== undefined) {
    const t = input.location?.trim();
    patch.location = t ? t : null;
  }
  if (input.memo !== undefined) {
    const t = input.memo?.trim();
    patch.memo = t ? t : null;
  }

  if (Object.keys(patch).length > 0) {
    const { error: upErr } = await supabase.from("library_books").update(patch).eq("id", libraryBookId);
    if (upErr) throw upErr;
  }

  const detail = await getLibraryBook(libraryBookId, userId, context);
  if (!detail) throw new Error("Not found");
  return detail;
}

export async function deleteLibraryBook(
  libraryBookId: string,
  userId: string,
  context?: RepositoryContext
): Promise<void> {
  const supabase = await getClient(context);
  const { data: lb, error: lbErr } = await supabase
    .from("library_books")
    .select("library_id")
    .eq("id", libraryBookId)
    .maybeSingle();

  if (lbErr) throw lbErr;
  if (!lb) {
    throw new Error("Not found");
  }

  await assertLibraryMember(lb.library_id as string, userId, context);

  const { error } = await supabase.from("library_books").delete().eq("id", libraryBookId);
  if (error) throw error;
}

export async function upsertMyLibraryBookState(
  libraryBookId: string,
  readingStatus: ReadingStatus,
  userId: string,
  context?: RepositoryContext
): Promise<LibraryBookDetail> {
  const supabase = await getClient(context);
  const { data: lb, error: lbErr } = await supabase
    .from("library_books")
    .select("library_id")
    .eq("id", libraryBookId)
    .maybeSingle();

  if (lbErr) throw lbErr;
  if (!lb) {
    throw new Error("Not found");
  }

  await assertLibraryMember(lb.library_id as string, userId, context);

  const { error: upErr } = await supabase.from("library_book_member_states").upsert(
    {
      library_book_id: libraryBookId,
      user_id: userId,
      reading_status: readingStatus,
      updated_at: new Date().toISOString()
    },
    { onConflict: "library_book_id,user_id" }
  );

  if (upErr) throw upErr;

  const detail = await getLibraryBook(libraryBookId, userId, context);
  if (!detail) throw new Error("Not found");
  return detail;
}
