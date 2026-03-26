import { upsertAppProfileRow } from "@/lib/auth/app-profiles";
import { awardPointsJoinMembership } from "@/lib/points/award-points";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Google OAuth 등에서 동일 이메일이면 기존 app_users id를 재사용합니다.
 *
 * @history
 * - 2026-03-26: 신규 OAuth `app_users` 행에 대해 `user_signup` 포인트 시도
 */
export async function ensureOAuthAppUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<string> {
  const email = normalizeEmail(params.email);
  const supabase = createSupabaseAdminClient();

  const { data: existing, error: selectError } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing?.id) {
    const patch: Record<string, string | null> = {};
    if (params.name != null) patch.name = params.name;
    if (params.image != null) patch.image = params.image;
    if (Object.keys(patch).length > 0) {
      await supabase.from("app_users").update(patch).eq("id", existing.id);
    }
    await upsertAppProfileRow(existing.id, {
      ...(params.name != null ? { displayName: params.name } : {}),
      ...(params.image != null ? { avatarUrl: params.image } : {})
    });
    return existing.id;
  }

  const { data: created, error: insertError } = await supabase
    .from("app_users")
    .insert({
      email,
      name: params.name ?? null,
      image: params.image ?? null,
      email_verified: new Date().toISOString()
    })
    .select("id")
    .single();

  if (insertError) throw insertError;
  if (!created?.id) throw new Error("Failed to create app user");

  await upsertAppProfileRow(created.id, {
    displayName: params.name != null ? params.name : null,
    avatarUrl: params.image != null ? params.image : null
  });

  try {
    await awardPointsJoinMembership(created.id as string);
  } catch (e) {
    console.error("awardPointsJoinMembership", e);
  }

  return created.id;
}
