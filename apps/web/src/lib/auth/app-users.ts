import { upsertAppProfileRow } from "@/lib/auth/app-profiles";
import { awardPointsJoinMembership } from "@/lib/points/award-points";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Google OAuth 등에서 동일 이메일이면 기존 app_users id를 재사용합니다.
 * 기존 행이 있으면 표시 이름·아바타는 OAuth 값으로 갱신하지 않습니다.
 *
 * @history
 * - 2026-05-03: 동일 이메일 기존 계정 — `app_users`/`app_profiles`에 OAuth 닉네임·이미지 미반영
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

/**
 * 등록된 이메일(`app_users.email`)로 사용자 ID를 조회합니다.
 *
 * @history
 * - 2026-05-04: 관리자 개인 알림 수신자 해석용
 */
export async function findAppUserIdByEmail(email: string): Promise<string | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();
  if (error || !data?.id) {
    return null;
  }
  return data.id;
}

/**
 * `app_users` PK 존재 여부.
 *
 * @history
 * - 2026-05-04: 관리자 개인 알림 수신자(UUID) 검증용
 */
export async function appUserExistsById(id: string): Promise<boolean> {
  const trimmed = id.trim();
  if (!trimmed) {
    return false;
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("app_users").select("id").eq("id", trimmed).maybeSingle();
  return !error && !!data?.id;
}
