import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type SiteAnnouncementPublic = {
  id: string;
  title: string;
  body: string;
  published_at: string | null;
  expires_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SiteAnnouncementAdmin = SiteAnnouncementPublic & {
  is_published: boolean;
  created_by: string | null;
};

function mapPublic(row: {
  id: string;
  title: string;
  body: string;
  published_at: string | null;
  expires_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}): SiteAnnouncementPublic {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    published_at: row.published_at,
    expires_at: row.expires_at,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * 헤더·공개 목록용 — 현재 시각 기준 게시 중인 공지만 반환합니다.
 *
 * @history
 * - 2026-05-04: 신규
 */
export async function listPublishedSiteAnnouncements(): Promise<SiteAnnouncementPublic[]> {
  const supabase = createSupabaseAdminClient();
  const now = Date.now();

  const { data, error } = await supabase
    .from("site_announcements")
    .select(
      "id, title, body, published_at, expires_at, sort_order, created_at, updated_at",
    )
    .eq("is_published", true)
    .not("published_at", "is", null)
    .lte("published_at", new Date(now).toISOString())
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []).filter((row) => {
    if (!row.expires_at) {
      return true;
    }
    return new Date(row.expires_at).getTime() > now;
  });

  return rows.map((row) => mapPublic(row));
}

/**
 * 관리자 목록 — 전체 행(비게시 포함).
 *
 * @history
 * - 2026-05-04: 신규
 */
export async function listAllSiteAnnouncementsAdmin(): Promise<SiteAnnouncementAdmin[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("site_announcements")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SiteAnnouncementAdmin[];
}

export type InsertSiteAnnouncementInput = {
  title: string;
  body: string;
  isPublished: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  sortOrder: number;
  createdBy: string;
};

/**
 * @history
 * - 2026-05-04: 신규
 */
export async function insertSiteAnnouncement(
  input: InsertSiteAnnouncementInput,
): Promise<SiteAnnouncementAdmin> {
  const supabase = createSupabaseAdminClient();
  const publishedAt = input.isPublished
    ? (input.publishedAt ?? new Date().toISOString())
    : null;

  const { data, error } = await supabase
    .from("site_announcements")
    .insert({
      title: input.title,
      body: input.body,
      is_published: input.isPublished,
      published_at: publishedAt,
      expires_at: input.expiresAt,
      sort_order: input.sortOrder,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "insert failed");
  }

  return data as SiteAnnouncementAdmin;
}

export type UpdateSiteAnnouncementInput = {
  id: string;
  title?: string;
  body?: string;
  isPublished?: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
  sortOrder?: number;
};

/**
 * @history
 * - 2026-05-04: 신규
 */
export async function updateSiteAnnouncement(
  input: UpdateSiteAnnouncementInput,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const patch: Record<string, unknown> = {};

  if (typeof input.title === "string") {
    patch.title = input.title;
  }
  if (typeof input.body === "string") {
    patch.body = input.body;
  }
  if (typeof input.sortOrder === "number") {
    patch.sort_order = input.sortOrder;
  }
  if (input.expiresAt !== undefined) {
    patch.expires_at = input.expiresAt;
  }
  if (typeof input.isPublished === "boolean") {
    patch.is_published = input.isPublished;
    if (input.isPublished) {
      patch.published_at = input.publishedAt ?? new Date().toISOString();
    } else {
      patch.published_at = null;
    }
  } else if (input.publishedAt !== undefined) {
    patch.published_at = input.publishedAt;
  }

  if (Object.keys(patch).length === 0) {
    return;
  }

  const { error } = await supabase
    .from("site_announcements")
    .update(patch)
    .eq("id", input.id);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * @history
 * - 2026-05-04: 신규
 */
export async function deleteSiteAnnouncement(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("site_announcements").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}
