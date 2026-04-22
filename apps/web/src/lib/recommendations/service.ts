import { createSupabaseAdminClient } from "@/lib/supabase/server";

type InteractionType =
  | "impression"
  | "click"
  | "detail_view"
  | "save"
  | "dismiss"
  | "start_read"
  | "complete_read"
  | "rate";

type JsonObject = Record<string, unknown>;

type UserPreferenceProfile = {
  userId: string;
  genreWeights: Record<string, number>;
  authorWeights: Record<string, number>;
  formatWeights: Record<string, number>;
  avgRating: number | null;
  completionRate: number;
  recencyBias: number;
  profileWindowDays: number;
  updatedAt: string;
};

type RecommendationBook = {
  bookId: string;
  title: string;
  authors: string[];
  genreSlugs: string[];
  format: string;
  coverUrl: string | null;
  score: number;
  reasons: string[];
};

type BuildRecommendationsResult = {
  algorithmVersion: string;
  profileUpdatedAt: string | null;
  items: RecommendationBook[];
};

type UserBookForProfile = {
  rating: number | null;
  reading_status: string;
  updated_at: string;
  books:
    | {
        genre_slugs: string[] | null;
        authors: string[] | null;
        format: string | null;
      }
    | Array<{
        genre_slugs: string[] | null;
        authors: string[] | null;
        format: string | null;
      }>
    | null;
};

type CandidateBookRow = {
  id: string;
  title: string;
  authors: string[] | null;
  genre_slugs: string[] | null;
  format: string | null;
  cover_url: string | null;
};

type BookFeatureRow = {
  book_id: string;
  global_popularity_score: number | null;
  freshness_score: number | null;
  content_quality_score: number | null;
};

const INTERACTION_WEIGHT: Record<InteractionType, number> = {
  impression: 0.1,
  click: 1,
  detail_view: 1.2,
  save: 3,
  dismiss: -2,
  start_read: 2,
  complete_read: 5,
  rate: 4
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeWeightMap(input: Record<string, number>): Record<string, number> {
  const values = Object.values(input).filter((v) => Number.isFinite(v) && v > 0);
  const max = values.length > 0 ? Math.max(...values) : 1;
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }
    out[key] = Number((value / max).toFixed(6));
  }
  return out;
}

function toNumberMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const n = Number(raw);
    if (Number.isFinite(n)) {
      out[key] = n;
    }
  }
  return out;
}

function daysFromNow(iso: string): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) {
    return 0;
  }
  const delta = Date.now() - t;
  return Math.max(0, delta / (1000 * 60 * 60 * 24));
}

function computeRecencyMultiplier(updatedAt: string): number {
  const days = daysFromNow(updatedAt);
  if (days <= 30) return 1.2;
  if (days <= 90) return 1.0;
  if (days <= 180) return 0.85;
  return 0.7;
}

function mergeReason(reasons: Set<string>, reason: string, condition: boolean): void {
  if (condition) {
    reasons.add(reason);
  }
}

/**
 * 사용자-도서 상호작용 로그 1건을 저장합니다.
 *
 * @history
 * - 2026-04-22: 신규 — 추천 1차 상호작용 이벤트 적재
 */
export async function recordUserBookInteraction(params: {
  userId: string;
  bookId: string;
  interactionType: InteractionType;
  interactionValue?: number | null;
  surface?: string | null;
  sessionId?: string | null;
  requestId?: string | null;
  metadata?: JsonObject;
  occurredAt?: string | null;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const payload = {
    user_id: params.userId,
    book_id: params.bookId,
    interaction_type: params.interactionType,
    interaction_value:
      params.interactionValue != null && Number.isFinite(params.interactionValue)
        ? Number(params.interactionValue)
        : null,
    surface: params.surface?.trim() || null,
    session_id: params.sessionId?.trim() || null,
    request_id: params.requestId?.trim() || null,
    metadata: params.metadata ?? {},
    occurred_at: params.occurredAt ? new Date(params.occurredAt).toISOString() : new Date().toISOString()
  };

  const { error } = await supabase.from("user_book_interactions").insert(payload);
  if (error) {
    throw error;
  }
}

/**
 * 추천 노출 로그를 배치 삽입합니다.
 *
 * @history
 * - 2026-04-22: 신규 — 추천 1차 노출/성과 로그 적재
 */
export async function recordRecommendationImpressions(params: {
  userId: string;
  algorithmVersion: string;
  experimentBucket?: string;
  requestId?: string | null;
  items: Array<{
    bookId: string;
    rank: number;
    score?: number | null;
    reasonCodes?: string[];
  }>;
}): Promise<void> {
  if (params.items.length === 0) {
    return;
  }
  const supabase = createSupabaseAdminClient();
  const rows = params.items.map((item) => ({
    user_id: params.userId,
    book_id: item.bookId,
    algorithm_version: params.algorithmVersion,
    experiment_bucket: params.experimentBucket?.trim() || "default",
    request_id: params.requestId?.trim() || null,
    rank: Math.max(1, Math.floor(item.rank)),
    score: item.score != null && Number.isFinite(item.score) ? Number(item.score) : null,
    reason_codes: item.reasonCodes ?? []
  }));

  const { error } = await supabase.from("recommendation_impressions").insert(rows);
  if (error) {
    throw error;
  }
}

/**
 * 최근 사용자 데이터로 선호 프로필(장르/저자/포맷 가중치)을 재계산합니다.
 *
 * @history
 * - 2026-04-22: 신규 — 추천 2차 사용자 프로필 집계
 */
export async function rebuildUserPreferenceProfile(userId: string): Promise<UserPreferenceProfile> {
  const supabase = createSupabaseAdminClient();
  const windowDays = 180;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("user_books")
    .select("rating,reading_status,updated_at,books!inner(genre_slugs,authors,format)")
    .eq("user_id", userId)
    .gte("updated_at", since);
  if (error) {
    throw error;
  }

  const genreWeightsRaw: Record<string, number> = {};
  const authorWeightsRaw: Record<string, number> = {};
  const formatWeightsRaw: Record<string, number> = {};
  let ratingSum = 0;
  let ratingCount = 0;
  let completedCount = 0;

  for (const row of (rows ?? []) as UserBookForProfile[]) {
    const boostFromRating = row.rating != null ? clamp(row.rating, 1, 5) / 5 : 0.4;
    const statusBoost =
      row.reading_status === "completed"
        ? 1.3
        : row.reading_status === "reading"
          ? 1.0
          : row.reading_status === "dropped"
            ? 0.5
            : 0.7;
    const recency = computeRecencyMultiplier(row.updated_at);
    const weight = boostFromRating * statusBoost * recency;

    if (row.rating != null) {
      ratingSum += row.rating;
      ratingCount += 1;
    }
    if (row.reading_status === "completed") {
      completedCount += 1;
    }

    const nestedBook = Array.isArray(row.books) ? (row.books[0] ?? null) : row.books;
    const genres = nestedBook?.genre_slugs ?? [];
    for (const genre of genres) {
      if (!genre) continue;
      genreWeightsRaw[genre] = (genreWeightsRaw[genre] ?? 0) + weight;
    }

    const authors = nestedBook?.authors ?? [];
    for (const author of authors) {
      const key = author?.trim();
      if (!key) continue;
      authorWeightsRaw[key] = (authorWeightsRaw[key] ?? 0) + weight;
    }

    const formatKey = nestedBook?.format?.trim() || "unknown";
    formatWeightsRaw[formatKey] = (formatWeightsRaw[formatKey] ?? 0) + weight;
  }

  const genreWeights = normalizeWeightMap(genreWeightsRaw);
  const authorWeights = normalizeWeightMap(authorWeightsRaw);
  const formatWeights = normalizeWeightMap(formatWeightsRaw);
  const avgRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : null;
  const total = (rows ?? []).length;
  const completionRate = total > 0 ? Number((completedCount / total).toFixed(5)) : 0;
  const recencyBias = total > 0 ? Number(clamp(completionRate * 0.5 + 0.5, 0.2, 1).toFixed(5)) : 0.5;

  const { error: upsertError } = await supabase.from("user_preference_profiles").upsert(
    {
      user_id: userId,
      genre_weights: genreWeights,
      author_weights: authorWeights,
      format_weights: formatWeights,
      avg_rating: avgRating,
      completion_rate: completionRate,
      recency_bias: recencyBias,
      profile_window_days: windowDays,
      source_summary: {
        samples: total,
        calculatedAt: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );
  if (upsertError) {
    throw upsertError;
  }

  const { data: saved, error: fetchError } = await supabase
    .from("user_preference_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (fetchError) {
    throw fetchError;
  }

  return {
    userId,
    genreWeights: toNumberMap(saved.genre_weights),
    authorWeights: toNumberMap(saved.author_weights),
    formatWeights: toNumberMap(saved.format_weights),
    avgRating: saved.avg_rating != null ? Number(saved.avg_rating) : null,
    completionRate: Number(saved.completion_rate ?? 0),
    recencyBias: Number(saved.recency_bias ?? 0.5),
    profileWindowDays: Number(saved.profile_window_days ?? windowDays),
    updatedAt: String(saved.updated_at)
  };
}

async function getOrBuildPreferenceProfile(userId: string): Promise<UserPreferenceProfile> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_preference_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return rebuildUserPreferenceProfile(userId);
  }
  return {
    userId,
    genreWeights: toNumberMap(data.genre_weights),
    authorWeights: toNumberMap(data.author_weights),
    formatWeights: toNumberMap(data.format_weights),
    avgRating: data.avg_rating != null ? Number(data.avg_rating) : null,
    completionRate: Number(data.completion_rate ?? 0),
    recencyBias: Number(data.recency_bias ?? 0.5),
    profileWindowDays: Number(data.profile_window_days ?? 180),
    updatedAt: String(data.updated_at)
  };
}

/**
 * 사용자 선호 프로필 + 도서 피처 벡터를 합쳐 Top-N 추천 목록을 계산합니다.
 *
 * @history
 * - 2026-04-22: 신규 — 추천 2차 하이브리드 점수 계산(콘텐츠 + 인기도/신선도)
 */
export async function buildHybridRecommendations(params: {
  userId: string;
  limit?: number;
  candidatePoolSize?: number;
}): Promise<BuildRecommendationsResult> {
  const supabase = createSupabaseAdminClient();
  const limit = clamp(Math.floor(params.limit ?? 20), 1, 50);
  const candidatePoolSize = clamp(Math.floor(params.candidatePoolSize ?? 150), limit, 300);
  const profile = await getOrBuildPreferenceProfile(params.userId);

  const { data: ownedRows, error: ownedError } = await supabase
    .from("user_books")
    .select("book_id")
    .eq("user_id", params.userId);
  if (ownedError) {
    throw ownedError;
  }
  const ownedBookIds = new Set((ownedRows ?? []).map((r) => String(r.book_id)));

  const { data: candidates, error: candidatesError } = await supabase
    .from("books")
    .select("id,title,authors,genre_slugs,format,cover_url")
    .limit(candidatePoolSize);
  if (candidatesError) {
    throw candidatesError;
  }
  const candidateRows = (candidates ?? []) as CandidateBookRow[];
  const candidateBookIds = candidateRows.map((row) => row.id);

  const { data: featureRows, error: featureError } = await supabase
    .from("book_feature_vectors")
    .select("book_id,global_popularity_score,freshness_score,content_quality_score")
    .in("book_id", candidateBookIds);
  if (featureError) {
    throw featureError;
  }
  const featureMap = new Map<string, BookFeatureRow>();
  for (const row of (featureRows ?? []) as BookFeatureRow[]) {
    featureMap.set(row.book_id, row);
  }

  const scored: RecommendationBook[] = [];
  for (const row of candidateRows) {
    if (ownedBookIds.has(row.id)) {
      continue;
    }
    const reasons = new Set<string>();
    let contentScore = 0;

    for (const genre of row.genre_slugs ?? []) {
      const weight = profile.genreWeights[genre] ?? 0;
      contentScore += weight * 3;
      mergeReason(reasons, `genre:${genre}`, weight >= 0.5);
    }
    for (const author of row.authors ?? []) {
      const weight = profile.authorWeights[author] ?? 0;
      contentScore += weight * 2.5;
      mergeReason(reasons, `author:${author}`, weight >= 0.6);
    }
    const formatWeight = profile.formatWeights[row.format ?? "unknown"] ?? 0;
    contentScore += formatWeight * 1.5;
    mergeReason(reasons, `format:${row.format ?? "unknown"}`, formatWeight >= 0.5);

    const feature = featureMap.get(row.id);
    const popularityScore = Number(feature?.global_popularity_score ?? 0);
    const freshnessScore = Number(feature?.freshness_score ?? 0);
    const qualityScore = Number(feature?.content_quality_score ?? 0);

    const finalScore =
      contentScore * 0.6 +
      clamp(popularityScore, 0, 1) * 0.25 +
      clamp(freshnessScore, 0, 1) * 0.1 +
      clamp(qualityScore, 0, 1) * 0.05;

    scored.push({
      bookId: row.id,
      title: row.title,
      authors: row.authors ?? [],
      genreSlugs: row.genre_slugs ?? [],
      format: row.format ?? "unknown",
      coverUrl: row.cover_url,
      score: Number(finalScore.toFixed(6)),
      reasons: [...reasons].slice(0, 3)
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return {
    algorithmVersion: "hybrid-v1",
    profileUpdatedAt: profile.updatedAt,
    items: scored.slice(0, limit)
  };
}

/**
 * 도서 피처 벡터/품질 점수를 배치 upsert 합니다.
 *
 * @history
 * - 2026-04-22: 신규 — 추천 2차 book_feature_vectors 적재 API 지원
 */
export async function upsertBookFeatureVectors(
  rows: Array<{
    bookId: string;
    embedding?: number[] | null;
    embeddingModelVersion?: string | null;
    contentQualityScore?: number | null;
    freshnessScore?: number | null;
    globalPopularityScore?: number | null;
    featureSummary?: JsonObject;
  }>
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }
  const supabase = createSupabaseAdminClient();
  const payload = rows.map((row) => ({
    book_id: row.bookId,
    embedding: Array.isArray(row.embedding)
      ? row.embedding.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0))
      : null,
    embedding_model_version: row.embeddingModelVersion?.trim() || null,
    content_quality_score:
      row.contentQualityScore != null && Number.isFinite(row.contentQualityScore)
        ? clamp(row.contentQualityScore, 0, 1)
        : 0,
    freshness_score:
      row.freshnessScore != null && Number.isFinite(row.freshnessScore) ? clamp(row.freshnessScore, 0, 1) : 0,
    global_popularity_score:
      row.globalPopularityScore != null && Number.isFinite(row.globalPopularityScore)
        ? clamp(row.globalPopularityScore, 0, 1)
        : 0,
    feature_summary: row.featureSummary ?? {},
    updated_at: new Date().toISOString()
  }));
  const { error } = await supabase
    .from("book_feature_vectors")
    .upsert(payload, { onConflict: "book_id", ignoreDuplicates: false });
  if (error) {
    throw error;
  }
  return payload.length;
}
