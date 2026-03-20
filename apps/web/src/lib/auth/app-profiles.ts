import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AppProfileView = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export async function getAppProfile(userId: string): Promise<AppProfileView | null> {
  const supabase = createSupabaseAdminClient();

  const { data: user, error: userError } = await supabase
    .from("app_users")
    .select("id,email,name,image")
    .eq("id", userId)
    .maybeSingle();

  if (userError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("app_profiles")
    .select("display_name,avatar_url")
    .eq("id", userId)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    displayName: profile?.display_name ?? user.name ?? null,
    avatarUrl: profile?.avatar_url ?? user.image ?? null
  };
}

/**
 * 프로필·app_users.name/image 동기화.
 * `input`에 키가 없으면 기존 app_profiles / app_users 값을 유지합니다.
 */
export async function upsertAppProfileRow(
  userId: string,
  input: { displayName?: string | null; avatarUrl?: string | null }
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: prof } = await supabase.from("app_profiles").select("display_name,avatar_url").eq("id", userId).maybeSingle();

  const { data: usr } = await supabase.from("app_users").select("name,image").eq("id", userId).maybeSingle();

  const display_name =
    Object.prototype.hasOwnProperty.call(input, "displayName") && input.displayName !== undefined
      ? input.displayName?.trim() || null
      : prof?.display_name ?? usr?.name ?? null;

  const avatar_url =
    Object.prototype.hasOwnProperty.call(input, "avatarUrl") && input.avatarUrl !== undefined
      ? input.avatarUrl?.trim() || null
      : prof?.avatar_url ?? usr?.image ?? null;

  const { error: profileError } = await supabase.from("app_profiles").upsert(
    { id: userId, display_name, avatar_url },
    { onConflict: "id" }
  );
  if (profileError) throw profileError;

  const { error: userError } = await supabase
    .from("app_users")
    .update({ name: display_name, image: avatar_url })
    .eq("id", userId);
  if (userError) throw userError;
}
