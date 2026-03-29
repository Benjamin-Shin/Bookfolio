import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminSharedLibraryMemberRow = {
  userId: string;
  role: string;
  displayLabel: string;
};

export type AdminSharedLibraryOverviewRow = {
  id: string;
  name: string;
  description: string | null;
  kind: string;
  createdBy: string;
  creatorLabel: string;
  createdAt: string;
  members: AdminSharedLibraryMemberRow[];
  distinctBookCount: number;
};

type AppUserMini = {
  id: string;
  email: string;
  name: string | null;
  app_profiles: { display_name: string | null } | { display_name: string | null }[] | null;
};

function effectiveUserDisplayLabel(row: AppUserMini): string {
  const prof = row.app_profiles;
  const fromProfile = Array.isArray(prof) ? prof[0]?.display_name : prof?.display_name;
  const nick = (fromProfile ?? row.name)?.trim();
  if (nick) {
    return nick;
  }
  return row.email;
}

/**
 * 관리자용 공동서재(`libraries`) 목록 집계 — 멤버 표시명·캐논 도서 distinct 수.
 *
 * @history
 * - 2026-03-29: 신규 — 멤버(`library_members`)·`library_user_books`→`user_books.book_id` 기준 권 수
 */
export async function fetchAdminSharedLibrariesOverview(): Promise<AdminSharedLibraryOverviewRow[]> {
  const supabase = createSupabaseAdminClient();

  const { data: libRows, error: libErr } = await supabase
    .from("libraries")
    .select("id,name,description,kind,created_by,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (libErr) {
    throw new Error(libErr.message);
  }

  const libraries = libRows ?? [];
  if (libraries.length === 0) {
    return [];
  }

  const libraryIds = libraries.map((l) => l.id as string);

  const [{ data: memberRows, error: memErr }, { data: lubRows, error: lubErr }] = await Promise.all([
    supabase.from("library_members").select("library_id,user_id,role").in("library_id", libraryIds),
    supabase.from("library_user_books").select("library_id,user_book_id").in("library_id", libraryIds)
  ]);

  if (memErr) {
    throw new Error(memErr.message);
  }
  if (lubErr) {
    throw new Error(lubErr.message);
  }

  const membersByLibrary = new Map<string, { userId: string; role: string }[]>();
  const allUserIds = new Set<string>();
  for (const l of libraries) {
    allUserIds.add(l.created_by as string);
  }
  for (const m of memberRows ?? []) {
    const lid = m.library_id as string;
    const uid = m.user_id as string;
    allUserIds.add(uid);
    const list = membersByLibrary.get(lid) ?? [];
    list.push({ userId: uid, role: m.role as string });
    membersByLibrary.set(lid, list);
  }

  const userIdList = [...allUserIds];
  const { data: userRows, error: userErr } = await supabase
    .from("app_users")
    .select("id,email,name,app_profiles(display_name)")
    .in("id", userIdList);

  if (userErr) {
    throw new Error(userErr.message);
  }

  const userById = new Map<string, AppUserMini>();
  for (const u of (userRows ?? []) as AppUserMini[]) {
    userById.set(u.id, u);
  }

  const ubIds = [...new Set((lubRows ?? []).map((r) => r.user_book_id as string))];
  const bookIdByUserBook = new Map<string, string>();
  if (ubIds.length > 0) {
    const chunk = 800;
    for (let i = 0; i < ubIds.length; i += chunk) {
      const slice = ubIds.slice(i, i + chunk);
      const { data: ubData, error: ubErr } = await supabase.from("user_books").select("id,book_id").in("id", slice);
      if (ubErr) {
        throw new Error(ubErr.message);
      }
      for (const row of ubData ?? []) {
        bookIdByUserBook.set(row.id as string, row.book_id as string);
      }
    }
  }

  const distinctBooksByLibrary = new Map<string, Set<string>>();
  for (const r of lubRows ?? []) {
    const lid = r.library_id as string;
    const bid = bookIdByUserBook.get(r.user_book_id as string);
    if (!bid) {
      continue;
    }
    let set = distinctBooksByLibrary.get(lid);
    if (!set) {
      set = new Set();
      distinctBooksByLibrary.set(lid, set);
    }
    set.add(bid);
  }

  return libraries.map((l) => {
    const id = l.id as string;
    const creator = userById.get(l.created_by as string);
    const creatorLabel = creator ? effectiveUserDisplayLabel(creator) : "(알 수 없음)";
    const rawMembers = membersByLibrary.get(id) ?? [];
    const members: AdminSharedLibraryMemberRow[] = rawMembers.map((m) => {
      const u = userById.get(m.userId);
      return {
        userId: m.userId,
        role: m.role,
        displayLabel: u ? effectiveUserDisplayLabel(u) : m.userId
      };
    });
    members.sort((a, b) => a.displayLabel.localeCompare(b.displayLabel, "ko"));

    return {
      id,
      name: l.name as string,
      description: (l.description as string | null) ?? null,
      kind: l.kind as string,
      createdBy: l.created_by as string,
      creatorLabel,
      createdAt: l.created_at as string,
      members,
      distinctBookCount: distinctBooksByLibrary.get(id)?.size ?? 0
    };
  });
}
