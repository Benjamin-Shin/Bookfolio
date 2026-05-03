import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { resolveAdminNotificationRecipient } from "@/lib/site/resolve-admin-notification-recipient";
import { insertUserNotification } from "@/lib/site/user-notifications-repository";

type PersonalNotifyKind = "info" | "success" | "warning" | "system";

const KINDS: readonly PersonalNotifyKind[] = ["info", "success", "warning", "system"];

function parseKind(raw: unknown): PersonalNotifyKind | null {
  return typeof raw === "string" && KINDS.includes(raw as PersonalNotifyKind)
    ? (raw as PersonalNotifyKind)
    : null;
}

/**
 * 관리자 전용 개인 알림 생성 (`user_notifications`). 전역 공지와 무관합니다.
 *
 * @history
 * - 2026-05-04: 신규 — `POST` + `action: "create"`
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdminApi();
  if (!admin.ok) {
    return admin.response;
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      recipient?: string;
      title?: string;
      body?: string;
      kind?: string;
    };

    const action = typeof body.action === "string" ? body.action.trim().toLowerCase() : "";
    if (action !== "create") {
      return NextResponse.json({ error: "action은 create 여야 합니다." }, { status: 400 });
    }

    const recipientRaw = typeof body.recipient === "string" ? body.recipient : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const text = typeof body.body === "string" ? body.body.trim() : "";
    const kind = parseKind(body.kind ?? "info");

    if (!title || !text) {
      return NextResponse.json({ error: "title과 body는 필수입니다." }, { status: 400 });
    }
    if (!kind) {
      return NextResponse.json({ error: "kind가 올바르지 않습니다." }, { status: 400 });
    }

    const resolved = await resolveAdminNotificationRecipient(recipientRaw);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.message }, { status: 400 });
    }

    const row = await insertUserNotification({
      userId: resolved.userId,
      title,
      body: text,
      kind,
      metadata: {
        source: "admin_api",
        sent_by: admin.userId,
      },
    });

    return NextResponse.json({ notification: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
