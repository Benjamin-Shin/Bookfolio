import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { getUserPointsBalance } from "@/lib/points/balance";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hasActiveVipSubscription } from "@/lib/subscription/vip";

/**
 * 현재 사용자 포인트 잔액·VIP 여부.
 *
 * @history
 * - 2026-03-28: 신규
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    void request;
    const supabase = createSupabaseAdminClient();
    const [balance, vip] = await Promise.all([
      getUserPointsBalance(supabase, userId),
      hasActiveVipSubscription(supabase, userId)
    ]);
    return NextResponse.json({ balance, vipActive: vip });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
