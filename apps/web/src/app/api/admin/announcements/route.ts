import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/require-admin-api";
import {
  deleteSiteAnnouncement,
  insertSiteAnnouncement,
  listAllSiteAnnouncementsAdmin,
  updateSiteAnnouncement,
} from "@/lib/site/announcements-repository";

/**
 * 관리자 전용 전역 공지 CRUD (`GET` 목록, `POST` create/update/delete).
 *
 * @history
 * - 2026-05-04: 신규
 */
export async function GET() {
  const admin = await requireAdminApi();
  if (!admin.ok) {
    return admin.response;
  }
  try {
    const announcements = await listAllSiteAnnouncementsAdmin();
    return NextResponse.json({ announcements });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load announcements";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminApi();
  if (!admin.ok) {
    return admin.response;
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      id?: string;
      title?: string;
      body?: string;
      isPublished?: boolean;
      publishedAt?: string | null;
      expiresAt?: string | null;
      sortOrder?: number;
    };

    const action = typeof body.action === "string" ? body.action.trim().toLowerCase() : "";

    if (action === "create") {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const text = typeof body.body === "string" ? body.body.trim() : "";
      if (!title || !text) {
        return NextResponse.json({ error: "title과 body는 필수입니다." }, { status: 400 });
      }
      const row = await insertSiteAnnouncement({
        title,
        body: text,
        isPublished: body.isPublished === true,
        publishedAt:
          typeof body.publishedAt === "string" && body.publishedAt.trim().length > 0
            ? body.publishedAt
            : null,
        expiresAt:
          typeof body.expiresAt === "string" && body.expiresAt.trim().length > 0
            ? body.expiresAt
            : null,
        sortOrder:
          typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
            ? body.sortOrder
            : 0,
        createdBy: admin.userId,
      });
      return NextResponse.json({ announcement: row });
    }

    if (action === "update") {
      const id = typeof body.id === "string" ? body.id.trim() : "";
      if (!id) {
        return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
      }
      await updateSiteAnnouncement({
        id,
        title: typeof body.title === "string" ? body.title.trim() : undefined,
        body: typeof body.body === "string" ? body.body.trim() : undefined,
        isPublished:
          typeof body.isPublished === "boolean" ? body.isPublished : undefined,
        publishedAt: body.publishedAt,
        expiresAt: body.expiresAt,
        sortOrder:
          typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
            ? body.sortOrder
            : undefined,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const id = typeof body.id === "string" ? body.id.trim() : "";
      if (!id) {
        return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
      }
      await deleteSiteAnnouncement(id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "action은 create, update, delete 중 하나여야 합니다." },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
