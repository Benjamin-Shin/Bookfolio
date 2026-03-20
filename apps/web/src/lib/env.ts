/**
 * Supabase 공개 값은 getter로 두어, 모듈이 로드될 때가 아니라 **실제 접근 시** 검증합니다.
 * 그렇지 않으면 레이아웃 등이 `supabase/server`만 transit import해도 `next build` 단계에서
 * (아직 env가 없는 환경 등) 정적 수집이 실패할 수 있습니다.
 *
 * `process.env.NEXT_PUBLIC_*`는 getter 본문에 그대로 두면 클라이언트 번들에서도 Next가 인라인합니다.
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

  metadataProvider: process.env.BOOK_METADATA_PROVIDER ?? "openlibrary"
};

