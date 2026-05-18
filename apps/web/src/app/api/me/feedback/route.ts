import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { isClientErrorRateLimited } from "@/lib/client-errors/rate-limit-in-memory";
import { parseUserFeedbackInput } from "@/lib/user-feedback/parse-feedback-input";
import { insertUserFeedback } from "@/lib/user-feedback/submit-user-feedback";

const POST_LIMIT_PER_HOUR = 20;
const WINDOW_MS = 60 * 60 * 1000;

/**
 * POST: 로그인 사용자 의견 1건 제출.
 *
 * @history
 * - 2026-05-18: 신규
 */
export async function POST(request: NextRequest) {
  let userId: string;
  try {
    userId = await getRequestUserId(request);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }

  const rateKey = `feedback:${userId}`;
  if (isClientErrorRateLimited(rateKey, POST_LIMIT_PER_HOUR, WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseUserFeedbackInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const { id } = await insertUserFeedback(userId, parsed);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("POST /api/me/feedback", e);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
