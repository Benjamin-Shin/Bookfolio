import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isDomesticAladinCategoryId } from "@/lib/aladin/categories";

export type AppProfileView = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  gender: string | null;
  /** `YYYY-MM-DD` 또는 null */
  birthDate: string | null;
  genderPublic: boolean;
  birthDatePublic: boolean;
  /** 올해 완독 목표 권수. null이면 미설정. */
  annualReadingGoal: number | null;
  /** 온보딩 완료 시각(ISO 8601). null이면 미완료. */
  onboardingCompletedAt: string | null;
  /** 알라딘 국내도서 관심 카테고리 CID(최대 5개). */
  favoriteAladinCategoryIds: number[];
};

export type UpsertAppProfileInput = {
  displayName?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  genderPublic?: boolean;
  birthDatePublic?: boolean;
  annualReadingGoal?: number | null;
  /** true이면 `onboarding_completed_at`을 현재 시각으로 설정 */
  onboardingCompleted?: boolean;
  favoriteAladinCategoryIds?: number[];
};

function normalizeFavoriteAladinCategoryIds(input: unknown): number[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const deduped = new Set<number>();
  for (const raw of input) {
    const cid = Math.floor(Number(raw));
    if (!Number.isFinite(cid) || !isDomesticAladinCategoryId(cid)) {
      continue;
    }
    deduped.add(cid);
    if (deduped.size >= 5) {
      break;
    }
  }
  return [...deduped];
}

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
    .select(
      "display_name,avatar_url,gender,birth_date,gender_public,birth_date_public,annual_reading_goal,onboarding_completed_at,favorite_aladin_category_ids"
    )
    .eq("id", userId)
    .maybeSingle();

  const p = profile as Record<string, unknown> | null | undefined;

  const goalRaw = p?.annual_reading_goal;
  const annualReadingGoal =
    goalRaw != null && Number.isFinite(Number(goalRaw)) ? Math.floor(Number(goalRaw)) : null;

  const ocRaw = p?.onboarding_completed_at;
  let onboardingCompletedAt: string | null = null;
  if (ocRaw != null && String(ocRaw).trim() !== "") {
    const d = new Date(String(ocRaw));
    if (!Number.isNaN(d.getTime())) {
      onboardingCompletedAt = d.toISOString();
    }
  }
  const favoriteAladinCategoryIds = normalizeFavoriteAladinCategoryIds(
    p?.favorite_aladin_category_ids
  );

  return {
    id: user.id,
    email: user.email,
    displayName: (p?.display_name as string | null | undefined) ?? user.name ?? null,
    avatarUrl: (p?.avatar_url as string | null | undefined) ?? user.image ?? null,
    gender: (p?.gender as string | null | undefined)?.trim() || null,
    birthDate:
      typeof p?.birth_date === "string" && p.birth_date.length >= 8
        ? (p.birth_date as string).slice(0, 10)
        : null,
    genderPublic: p?.gender_public === true,
    birthDatePublic: p?.birth_date_public === true,
    annualReadingGoal,
    onboardingCompletedAt,
    favoriteAladinCategoryIds
  };
}

/**
 * 프로필·`app_users.name` / `image` 동기화.
 * `input`에 키가 없으면 기존 `app_profiles` / `app_users` 값을 유지합니다.
 *
 * @history
 * - 2026-04-26: `favorite_aladin_category_ids`(국내도서 CID, 최대 5개)
 * - 2026-04-06: `onboarding_completed_at` — `onboardingCompleted`
 * - 2026-04-06: `annual_reading_goal`
 * - 2026-04-02: `gender`, `birthDate`, 공개 플래그
 */
export async function upsertAppProfileRow(userId: string, input: UpsertAppProfileInput): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: prof } = await supabase
    .from("app_profiles")
    .select(
      "display_name,avatar_url,gender,birth_date,gender_public,birth_date_public,annual_reading_goal,onboarding_completed_at,favorite_aladin_category_ids"
    )
    .eq("id", userId)
    .maybeSingle();

  const pr = prof as Record<string, unknown> | null | undefined;

  const { data: usr } = await supabase.from("app_users").select("name,image").eq("id", userId).maybeSingle();

  const display_name =
    Object.prototype.hasOwnProperty.call(input, "displayName") && input.displayName !== undefined
      ? input.displayName?.trim() || null
      : (pr?.display_name as string | null | undefined) ?? usr?.name ?? null;

  const avatar_url =
    Object.prototype.hasOwnProperty.call(input, "avatarUrl") && input.avatarUrl !== undefined
      ? input.avatarUrl?.trim() || null
      : (pr?.avatar_url as string | null | undefined) ?? usr?.image ?? null;

  const gender = Object.prototype.hasOwnProperty.call(input, "gender")
    ? (input.gender === null || input.gender === undefined
        ? null
        : String(input.gender).trim() || null)
    : (pr?.gender as string | null | undefined)?.trim() || null;

  let birth_date: string | null =
    pr?.birth_date != null && typeof pr.birth_date === "string"
      ? (pr.birth_date as string).slice(0, 10)
      : null;

  if (Object.prototype.hasOwnProperty.call(input, "birthDate")) {
    if (input.birthDate === null || input.birthDate === undefined) {
      birth_date = null;
    } else {
      const raw = String(input.birthDate).trim();
      birth_date = raw.length >= 8 ? raw.slice(0, 10) : null;
    }
  }

  const gender_public = Object.prototype.hasOwnProperty.call(input, "genderPublic")
    ? Boolean(input.genderPublic)
    : pr?.gender_public === true;

  const birth_date_public = Object.prototype.hasOwnProperty.call(input, "birthDatePublic")
    ? Boolean(input.birthDatePublic)
    : pr?.birth_date_public === true;

  let annual_reading_goal: number | null =
    pr?.annual_reading_goal != null && Number.isFinite(Number(pr.annual_reading_goal))
      ? Math.floor(Number(pr.annual_reading_goal))
      : null;

  if (Object.prototype.hasOwnProperty.call(input, "annualReadingGoal")) {
    const g = input.annualReadingGoal;
    if (g === null || g === undefined) {
      annual_reading_goal = null;
    } else {
      const n = Math.floor(Number(g));
      annual_reading_goal = n >= 1 && n <= 500 ? n : null;
    }
  }

  let onboarding_completed_at: string | null = null;
  if (pr?.onboarding_completed_at != null && String(pr.onboarding_completed_at).trim() !== "") {
    const d0 = new Date(String(pr.onboarding_completed_at));
    if (!Number.isNaN(d0.getTime())) {
      onboarding_completed_at = d0.toISOString();
    }
  }

  if (input.onboardingCompleted === true) {
    onboarding_completed_at = new Date().toISOString();
  }

  const favorite_aladin_category_ids = Object.prototype.hasOwnProperty.call(
    input,
    "favoriteAladinCategoryIds"
  )
    ? normalizeFavoriteAladinCategoryIds(input.favoriteAladinCategoryIds)
    : normalizeFavoriteAladinCategoryIds(pr?.favorite_aladin_category_ids);

  const { error: profileError } = await supabase.from("app_profiles").upsert(
    {
      id: userId,
      display_name,
      avatar_url,
      gender,
      birth_date,
      gender_public,
      birth_date_public,
      annual_reading_goal,
      onboarding_completed_at,
      favorite_aladin_category_ids
    },
    { onConflict: "id" }
  );
  if (profileError) {
    throw profileError;
  }

  const { error: userError } = await supabase
    .from("app_users")
    .update({ name: display_name, image: avatar_url })
    .eq("id", userId);
  if (userError) {
    throw userError;
  }
}
