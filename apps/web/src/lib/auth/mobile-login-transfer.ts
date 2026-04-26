import { randomBytes } from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

const TRANSFER_TTL_SECONDS = 60;

type TransferConsumeResult = {
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
};

function buildTransferCode(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * 모바일 Bearer 세션을 웹 세션으로 넘길 1회용 코드를 생성합니다.
 *
 * @history
 * - 2026-04-26: 신규 — 짧은 TTL(60초)·단일 사용 코드 발급
 */
export async function issueMobileLoginTransferCode(userId: string): Promise<{ code: string; expiresIn: number }> {
  const supabase = createSupabaseAdminClient();
  const code = buildTransferCode();
  const expiresAt = new Date(Date.now() + TRANSFER_TTL_SECONDS * 1000).toISOString();

  const { error } = await supabase.from("mobile_login_transfer_codes").insert({
    code,
    user_id: userId,
    expires_at: expiresAt
  });
  if (error) {
    throw error;
  }
  return { code, expiresIn: TRANSFER_TTL_SECONDS };
}

/**
 * 모바일 로그인 전이 코드를 1회 소비하고 사용자 정보를 반환합니다.
 *
 * @history
 * - 2026-04-26: 신규 — 만료/재사용 코드 차단 후 `used_at` 원자 갱신
 */
export async function consumeMobileLoginTransferCode(rawCode: string): Promise<TransferConsumeResult | null> {
  const code = rawCode.trim();
  if (!code) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data: consumedRows, error: consumeError } = await supabase
    .from("mobile_login_transfer_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("code", code)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("user_id")
    .limit(1);

  if (consumeError) {
    throw consumeError;
  }

  const consumed = consumedRows?.[0];
  if (!consumed?.user_id) {
    return null;
  }

  const { data: user, error: userError } = await supabase
    .from("app_users")
    .select("id, email, name, image")
    .eq("id", consumed.user_id)
    .maybeSingle();
  if (userError || !user) {
    return null;
  }

  return {
    userId: user.id as string,
    email: (user.email as string).trim().toLowerCase(),
    name: (user.name as string | null) ?? null,
    image: (user.image as string | null) ?? null
  };
}
