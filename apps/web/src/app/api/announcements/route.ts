import { NextResponse } from "next/server";

import { listPublishedSiteAnnouncements } from "@/lib/site/announcements-repository";

/**
 * 게시 중인 전역 공지 목록(비인증 허용).
 *
 * @history
 * - 2026-05-04: 신규
 */
export async function GET() {
  try {
    const announcements = await listPublishedSiteAnnouncements();
    return NextResponse.json({ announcements });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load announcements";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
