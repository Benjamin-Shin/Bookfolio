import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { getAppUserRole } from "@/lib/auth/get-app-user-role";
import { ensureOAuthAppUser } from "@/lib/auth/app-users";
import { verifyAppUserCredentials } from "@/lib/auth/verify-app-user-credentials";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const googleConfigured =
  Boolean(process.env.AUTH_GOOGLE_ID?.trim()) && Boolean(process.env.AUTH_GOOGLE_SECRET?.trim());

const providers: NextAuthConfig["providers"] = [];

if (googleConfigured) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!
    })
  );
}

providers.push(
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "이메일", type: "email" },
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

export const authConfig = {
  providers,
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google") {
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

      if (typeof token.sub === "string" && (token.role !== "ADMIN" && token.role !== "USER")) {
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
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
      }
      return session;
    }
  }
} satisfies NextAuthConfig;
