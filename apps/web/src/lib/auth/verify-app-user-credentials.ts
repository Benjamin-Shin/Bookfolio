import { compare } from "bcryptjs";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type VerifiedAppUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

/**
 * `@`가 없으면 `list_credential_emails_by_email_local`로 후보 이메일을 한 건만 특정한 뒤 검증합니다.
 * 후보가 없거나 둘 이상이면 `null`입니다.
 */
async function resolveCredentialLoginEmail(
  supabase: SupabaseClient,
  normalizedIdentifier: string
): Promise<string | null> {
  if (normalizedIdentifier.includes("@")) {
    return normalizedIdentifier;
  }

  const { data, error } = await supabase.rpc("list_credential_emails_by_email_local", {
    p_local: normalizedIdentifier
  });

  if (error) {
    return null;
  }

  const emails = (data ?? []) as string[];
  if (emails.length !== 1) {
    return null;
  }

  return emails[0] ?? null;
}

/**
 * NextAuth Credentials·모바일 비밀번호 로그인과 동일하게 `app_users.password_hash`로 검증합니다.
 * `loginIdentifier`는 trim·소문자 정규화된 **전체 이메일** 또는 **@ 앞 로컬 부분**일 수 있습니다.
 *
 * @history
 * - 2026-04-05: `@` 없을 때 로컬 부분으로 이메일 해석 (`0033` RPC)
 */
export async function verifyAppUserCredentials(
  loginIdentifier: string,
  password: string
): Promise<VerifiedAppUser | null> {
  const supabase = createSupabaseAdminClient();
  const email = await resolveCredentialLoginEmail(supabase, loginIdentifier);
  if (!email) {
    return null;
  }

  const { data: row, error } = await supabase
    .from("app_users")
    .select("id,email,password_hash,name,image")
    .eq("email", email)
    .maybeSingle();

  if (error || !row?.password_hash) {
    return null;
  }

  const ok = await compare(password, row.password_hash);
  if (!ok) {
    return null;
  }

  return {
    id: row.id,
    email: row.email ?? email,
    name: row.name,
    image: row.image
  };
}
