/**
 * @history
 * - 2026-04-05: Credentials 식별자 필드를 `text`로 — 이메일 또는 @ 앞 로컬 부분 로그인
 * - 2026-03-26: JWT/세션에 `STAFF` 역할 유지(0021)
 */
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";

import { getAppUserRole } from "@/lib/auth/get-app-user-role";
import { consumeMobileLoginTransferCode } from "@/lib/auth/mobile-login-transfer";
import { ensureOAuthAppUser } from "@/lib/auth/app-users";
import { verifyAppUserCredentials } from "@/lib/auth/verify-app-user-credentials";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const googleConfigured =
  Boolean(process.env.AUTH_GOOGLE_ID?.trim()) && Boolean(process.env.AUTH_GOOGLE_SECRET?.trim());
const kakaoConfigured =
  Boolean(process.env.AUTH_KAKAO_ID?.trim()) && Boolean(process.env.AUTH_KAKAO_SECRET?.trim());

const providers: NextAuthConfig["providers"] = [];

if (googleConfigured) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!
    })
  );
}

if (kakaoConfigured) {
  providers.push(
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!
    })
  );
}

providers.push(
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "이메일 또는 아이디", type: "text" },
      password: { label: "비밀번호", type: "password" }
    },
    async authorize(credentials) {
      const rawEmail = credentials?.email;
      const password = credentials?.password;
      if (!rawEmail || !password || typeof password !== "string") {
        return null;
      }

      const email = normalizeEmail(String(rawEmail));
      const user = await verifyAppUserCredentials(email, password);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        image: user.image ?? undefined
      };
    }
  })
);

providers.push(
  Credentials({
    id: "mobile-transfer",
    name: "mobile-transfer",
    credentials: {
      code: { label: "Transfer code", type: "text" }
    },
    /**
     * 모바일에서 발급한 1회용 코드로 웹 세션을 교환합니다.
     *
     * @history
     * - 2026-04-26: 신규 — 모바일 Bearer 세션을 웹 NextAuth 세션으로 전이하는 Credentials provider
     */
    async authorize(credentials) {
      const codeRaw = credentials?.code;
      if (!codeRaw) {
        return null;
      }
      const consumed = await consumeMobileLoginTransferCode(String(codeRaw));
      if (!consumed) {
        return null;
      }
      return {
        id: consumed.userId,
        email: consumed.email,
        name: consumed.name ?? undefined,
        image: consumed.image ?? undefined
      };
    }
  })
);

export const authConfig = {
  providers,
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "kakao") {
        const p = profile as { email?: string; name?: string; picture?: string };
        if (!p.email) {
          return token;
        }
        const id = await ensureOAuthAppUser({
          email: p.email,
          name: p.name,
          image: p.picture
        });
        token.sub = id;
        token.email = normalizeEmail(p.email);
        token.name = p.name;
        token.picture = p.picture;
        token.role = await getAppUserRole(id);
        return token;
      }

      if (user?.id) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = await getAppUserRole(user.id);
        return token;
      }

      if (
        typeof token.sub === "string" &&
        token.role !== "ADMIN" &&
        token.role !== "STAFF" &&
        token.role !== "USER"
      ) {
        token.role = await getAppUserRole(token.sub);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        if (typeof token.email === "string") session.user.email = token.email;
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.picture === "string") session.user.image = token.picture;
        const r = token.role;
        session.user.role = r === "ADMIN" ? "ADMIN" : r === "STAFF" ? "STAFF" : "USER";
      }
      return session;
    }
  }
} satisfies NextAuthConfig;
