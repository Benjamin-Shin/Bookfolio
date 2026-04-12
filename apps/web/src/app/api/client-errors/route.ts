import { NextRequest, NextResponse } from "next/server";

import { getOptionalRequestUserId } from "@/lib/auth/request-user";
import { isClientErrorRateLimited } from "@/lib/client-errors/rate-limit-in-memory";
import { getClientErrorRateLimitKey } from "@/lib/client-errors/request-client-key";
import { maskSensitivePlainText, sanitizeClientErrorContext } from "@/lib/client-errors/sanitize-context";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const POST_LIMIT_PER_HOUR = 60;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_MESSAGE = 2000;

function parsePlatform(raw: unknown): "web" | "mobile" | "unknown" {
  if (raw === "web" || raw === "mobile") {
    return raw;
  }
  return "unknown";
}

function parseKind(raw: unknown): string {
  if (typeof raw === "string" && raw.length > 0 && raw.length <= 64) {
    return raw.slice(0, 64);
  }
  return "client";
}

/**
 * POST: 익명·로그인 모두 허용. 클라이언트 오류 1건 저장.
 *
 * @history
 * - 2026-04-10: 신규
 */
export async function POST(request: NextRequest) {
  const key = getClientErrorRateLimitKey(request);
  if (isClientErrorRateLimited(key, POST_LIMIT_PER_HOUR, WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const messageRaw = o.message;
  if (typeof messageRaw !== "string" || messageRaw.trim().length === 0) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const message = maskSensitivePlainText(messageRaw.trim()).slice(0, MAX_MESSAGE);
  const platform = parsePlatform(o.platform);
  const kind = parseKind(o.kind);
  const context = sanitizeClientErrorContext(o.context ?? {}) as Record<string, unknown>;

  const userId = await getOptionalRequestUserId(request);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("client_error_reports")
    .insert({
      user_id: userId,
      platform,
      kind,
      message,
      context
    })
    .select("id")
    .single();

  if (error) {
    console.error("client-errors POST", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
