import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export type AdminSession = Session & {
  user: NonNullable<Session["user"]> & { id: string; role: "ADMIN" };
};

/**
 * 관리자 전용 라우트에서 호출합니다. 비로그인 → 로그인, USER → 내 서재로 보냅니다.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/admin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session as AdminSession;
}
