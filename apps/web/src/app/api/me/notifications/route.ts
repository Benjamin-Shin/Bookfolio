import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import {
  listUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead,
} from "@/lib/site/user-notifications-repository";

/**
 * 로그인 사용자 개인 알림 목록·읽음 처리.
 *
 * @history
 * - 2026-05-04: 신규 — GET 목록, POST `mark_read` | `mark_all_read`
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
    const notifications = await listUserNotifications(
      userId,
      Number.isFinite(limit) ? limit : 50,
    );
    return NextResponse.json({ notifications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load notifications";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const body = (await request.json()) as {
      action?: string;
      id?: string;
    };
    const action = typeof body.action === "string" ? body.action.trim().toLowerCase() : "";

    if (action === "mark_read") {
      const id = typeof body.id === "string" ? body.id.trim() : "";
      if (!id) {
        return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
      }
      await markUserNotificationRead(userId, id);
      const notifications = await listUserNotifications(userId, 50);
      return NextResponse.json({ notifications });
    }

    if (action === "mark_all_read") {
      await markAllUserNotificationsRead(userId);
      const notifications = await listUserNotifications(userId, 50);
      return NextResponse.json({ notifications });
    }

    return NextResponse.json(
      { error: "action은 mark_read 또는 mark_all_read 여야 합니다." },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update notifications";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
