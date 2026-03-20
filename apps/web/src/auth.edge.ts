import type { NextAuthConfig } from "next-auth";

/**
 * Edge(미들웨어)용 최소 설정. JWT 검증에 필요한 값만 포함합니다.
 * 실제 로그인·프로바이더는 `auth.config.ts` + `auth.ts`에서 처리합니다.
 */
export const edgeAuthConfig = {
  providers: [],
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  trustHost: true
} satisfies NextAuthConfig;
