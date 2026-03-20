import { compare } from "bcryptjs";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type VerifiedAppUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

/**
 * NextAuth Credentials와 동일하게 `app_users.password_hash`로 검증합니다.
 * `email`은 호출 전에 정규화(trim + lower)된 값이어야 합니다.
 */
export async function verifyAppUserCredentials(
  email: string,
  password: string
): Promise<VerifiedAppUser | null> {
  const supabase = createSupabaseAdminClient();
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
