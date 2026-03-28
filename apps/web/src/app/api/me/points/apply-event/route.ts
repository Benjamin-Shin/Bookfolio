import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { getUserPointsBalance } from "@/lib/points/balance";
import { tryAwardPointsForEvent } from "@/lib/points/award-points";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const EVENT_CODE_RE = /^[a-z][a-z0-9_]{0,62}$/;

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

/**
 * 활성 정책의 `event_code`에 따라 포인트를 적립·차감합니다. 멱등 키 필수.
 *
 * @history
 * - 2026-03-28: 신규 — 모바일·웹 클라이언트 공용
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const body = (await request.json()) as Record<string, unknown>;
    const eventCode = typeof body.eventCode === "string" ? body.eventCode.trim().toLowerCase() : "";
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    if (!EVENT_CODE_RE.test(eventCode)) {
      return NextResponse.json({ error: "유효하지 않은 eventCode입니다." }, { status: 400 });
    }
    if (!idempotencyKey || idempotencyKey.length > 200) {
      return NextResponse.json({ error: "idempotencyKey가 필요합니다." }, { status: 400 });
    }

    let refType: string | null =
      typeof body.refType === "string" && body.refType.trim() ? body.refType.trim() : null;
    let refId: string | null = null;
    if (body.refId !== undefined && body.refId !== null) {
      const rid = String(body.refId).trim();
      if (rid && !isUuid(rid)) {
        return NextResponse.json({ error: "refId는 UUID여야 합니다." }, { status: 400 });
      }
      refId = rid || null;
    }

    const supabase = createSupabaseAdminClient();
    const result = await tryAwardPointsForEvent(supabase, {
      userId,
      eventCode,
      idempotencyKey,
      refType,
      refId
    });

    if (!result.ok) {
      if (result.kind === "duplicate") {
        const balance = await getUserPointsBalance(supabase, userId);
        return NextResponse.json({ status: "duplicate", balance });
      }
      if (result.kind === "no_rule_or_zero") {
        return NextResponse.json({ error: "해당 이벤트 규칙이 없거나 점수가 0입니다." }, { status: 400 });
      }
      if (result.kind === "insufficient_balance") {
        return NextResponse.json(
          { error: "포인트가 부족합니다.", balance: result.balanceAfter },
          { status: 400 }
        );
      }
      if (result.kind === "cap_reached") {
        return NextResponse.json({ error: "이벤트 한도에 도달했습니다." }, { status: 400 });
      }
      return NextResponse.json({ error: "적용할 수 없습니다." }, { status: 400 });
    }

    if (result.kind === "vip_spend_exempt") {
      return NextResponse.json({
        status: "vip_spend_exempt",
        balance: result.balanceAfter
      });
    }

    return NextResponse.json({
      status: "posted",
      delta: result.delta,
      balance: result.balanceAfter
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
