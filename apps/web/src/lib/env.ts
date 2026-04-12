/**
 * Supabase 공개 값은 getter로 두어, 모듈이 로드될 때가 아니라 **실제 접근 시** 검증합니다.
 * 그렇지 않으면 레이아웃 등이 `supabase/server`만 transit import해도 `next build` 단계에서
 * (아직 env가 없는 환경 등) 정적 수집이 실패할 수 있습니다.
 *
 * `process.env.NEXT_PUBLIC_*`는 getter 본문에 그대로 두면 클라이언트 번들에서도 Next가 인라인합니다.
 *
 * @history
 * - 2026-04-08: `aladinTtbKey` — ItemLookUp(비소장 구매 힌트)
 * - 2026-03-25: `aladinItemNewApiBaseUrl` — 초이스 신간 등 별도 TTB URL
 * - 2026-03-25: `aladinBestsellerApiBaseUrl` 주석 — `next.config` `loadEnvConfig`와의 관계 안내
 * - 2026-03-25: `aladinBestsellerApiBaseUrl` — 알라딘 목록(서버 전용 URL)
 */
export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  appDownloadUrl: process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL?.trim() || undefined,

  get supabaseUrl(): string {
    const v = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (!v) throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
    return v;
  },

  get supabaseAnonKey(): string {
    const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!v) throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return v;
  },

  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  metadataProvider: process.env.BOOK_METADATA_PROVIDER ?? "openlibrary",

  /**
   * 알라딘 TTB ItemList 전체 URL(쿼리·ttbkey 포함). 서버 전용.
   * `apps/web/.env`는 `next.config.mjs`의 `loadEnvConfig(appDir)`로 항상 앱 루트에서 로드됩니다.
   */
  get aladinBestsellerApiBaseUrl(): string | undefined {
    const v = process.env.ALADIN_BESTSELLER_API_BASE_URL?.trim();
    return v || undefined;
  },

  /** 초이스 신간 등 별도 ItemList URL(서버 전용). */
  get aladinItemNewApiBaseUrl(): string | undefined {
    const v = process.env.ALADIN_ITEMNEW_API_BASE_URL?.trim();
    return v || undefined;
  },

  /**
   * 알라딘 ItemLookUp API TTB 키(선택). 없으면 알라딘은 검색 URL만 제공.
   *
   * @history
   * - 2026-04-08: 비소장 구매 링크 캐시 `ItemLookUp.aspx` 호출용
   */
  get aladinTtbKey(): string | undefined {
    const v = process.env.ALADIN_TTB_KEY?.trim();
    return v || undefined;
  }
};

