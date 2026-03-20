export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // `use client`에서도 정상 동작하도록 `process.env.NEXT_PUBLIC_*`를
  // 문자열 리터럴 직접 접근 형태로 둬서 Next.js 인라인이 되게 합니다.
  supabaseUrl: (() => {
    const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!v) throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
    return v;
  })(),

  supabaseAnonKey: (() => {
    const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!v) throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return v;
  })(),

  // 이것은 서버에서만 필요할 가능성이 큽니다. 클라이언트 번들에서는 undefined가 될 수 있어도 throw하지 않습니다.
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  metadataProvider: process.env.BOOK_METADATA_PROVIDER ?? "openlibrary"
};

