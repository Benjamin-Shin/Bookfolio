-- 추천 시스템 1차·2차 기반 스키마
-- 1차: 상호작용 로그, 추천 노출 로그
-- 2차: 사용자 선호 프로필 집계, 도서 피처 벡터 저장

create table if not exists public.user_book_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  interaction_type text not null check (
    interaction_type in (
      'impression',
      'click',
      'detail_view',
      'save',
      'dismiss',
      'start_read',
      'complete_read',
      'rate'
    )
  ),
  interaction_value numeric(10, 4),
  surface text,
  session_id text,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_book_interactions_user_occurred
  on public.user_book_interactions(user_id, occurred_at desc);
create index if not exists idx_user_book_interactions_book_occurred
  on public.user_book_interactions(book_id, occurred_at desc);
create index if not exists idx_user_book_interactions_type_occurred
  on public.user_book_interactions(interaction_type, occurred_at desc);
create index if not exists idx_user_book_interactions_request_id
  on public.user_book_interactions(request_id)
  where request_id is not null;

alter table public.user_book_interactions enable row level security;

create table if not exists public.recommendation_impressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  algorithm_version text not null default 'v1',
  experiment_bucket text not null default 'default',
  request_id text,
  rank integer not null check (rank >= 1),
  score numeric(12, 6),
  reason_codes jsonb not null default '[]'::jsonb,
  served_at timestamptz not null default now(),
  clicked_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_recommendation_impressions_user_served
  on public.recommendation_impressions(user_id, served_at desc);
create index if not exists idx_recommendation_impressions_book_served
  on public.recommendation_impressions(book_id, served_at desc);
create index if not exists idx_recommendation_impressions_request_id
  on public.recommendation_impressions(request_id)
  where request_id is not null;
create index if not exists idx_recommendation_impressions_algo_bucket
  on public.recommendation_impressions(algorithm_version, experiment_bucket, served_at desc);

alter table public.recommendation_impressions enable row level security;

create table if not exists public.user_preference_profiles (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  genre_weights jsonb not null default '{}'::jsonb,
  author_weights jsonb not null default '{}'::jsonb,
  format_weights jsonb not null default '{}'::jsonb,
  avg_rating numeric(4, 2),
  completion_rate numeric(6, 5) not null default 0,
  recency_bias numeric(6, 5) not null default 0.5,
  profile_window_days integer not null default 180 check (profile_window_days between 30 and 3650),
  source_summary jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_preference_profiles_updated_at
  on public.user_preference_profiles(updated_at desc);

alter table public.user_preference_profiles enable row level security;

create table if not exists public.book_feature_vectors (
  book_id uuid primary key references public.books(id) on delete cascade,
  embedding double precision[],
  embedding_model_version text,
  content_quality_score numeric(8, 5) not null default 0,
  freshness_score numeric(8, 5) not null default 0,
  global_popularity_score numeric(8, 5) not null default 0,
  feature_summary jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_book_feature_vectors_updated_at
  on public.book_feature_vectors(updated_at desc);
create index if not exists idx_book_feature_vectors_popularity
  on public.book_feature_vectors(global_popularity_score desc);

alter table public.book_feature_vectors enable row level security;
