"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  deleteSiteAnnouncement,
  insertSiteAnnouncement,
  updateSiteAnnouncement,
} from "@/lib/site/announcements-repository";

function parseOptionalDate(raw: string | null): string | null {
  if (raw == null) {
    return null;
  }
  const t = raw.trim();
  if (!t) {
    return null;
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * 관리자 공지 작성 폼.
 *
 * @history
 * - 2026-05-04: 신규
 */
export async function createAnnouncementFromForm(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const title = formData.get("title")?.toString().trim() ?? "";
  const body = formData.get("body")?.toString().trim() ?? "";
  if (!title || !body) {
    return;
  }
  const isPublished = formData.get("isPublished") === "on";
  const sortOrderRaw = formData.get("sortOrder")?.toString().trim() ?? "0";
  const sortOrder = Number.parseInt(sortOrderRaw, 10);
  await insertSiteAnnouncement({
    title,
    body,
    isPublished,
    publishedAt: parseOptionalDate(formData.get("publishedAt")?.toString() ?? null),
    expiresAt: parseOptionalDate(formData.get("expiresAt")?.toString() ?? null),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    createdBy: session.user.id,
  });
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}

/**
 * @history
 * - 2026-05-04: 신규
 */
export async function updateAnnouncementFromForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id")?.toString().trim() ?? "";
  if (!id) {
    return;
  }
  const title = formData.get("title")?.toString().trim() ?? "";
  const body = formData.get("body")?.toString().trim() ?? "";
  if (!title || !body) {
    return;
  }
  const pubRaw = formData.get("isPublished")?.toString();
  const isPublished = pubRaw === "true" ? true : pubRaw === "false" ? false : undefined;
  const sortOrderRaw = formData.get("sortOrder")?.toString().trim();
  const sortOrder =
    sortOrderRaw !== undefined && sortOrderRaw !== ""
      ? Number.parseInt(sortOrderRaw, 10)
      : undefined;

  await updateSiteAnnouncement({
    id,
    title,
    body,
    isPublished,
    publishedAt: parseOptionalDate(formData.get("publishedAt")?.toString() ?? null),
    expiresAt: parseOptionalDate(formData.get("expiresAt")?.toString() ?? null),
    sortOrder: sortOrder !== undefined && Number.isFinite(sortOrder) ? sortOrder : undefined,
  });
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}

/**
 * @history
 * - 2026-05-04: 신규
 */
export async function deleteAnnouncementFromForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id")?.toString().trim() ?? "";
  if (!id) {
    return;
  }
  await deleteSiteAnnouncement(id);
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}
