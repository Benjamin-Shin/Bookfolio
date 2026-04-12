import { createHash } from "node:crypto";

import type { NextRequest } from "next/server";

/**
 * 레이트 리밋용 비식별 클라이언트 키(원 IP 미저장).
 *
 * @history
 * - 2026-04-10: 신규
 */
export function getClientErrorRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  const ip = first || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`bookfolio-ce-v1|${ip}`).digest("hex").slice(0, 32);
}
