import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export type StaffOrAdminSession = Session & {
  user: NonNullable<Session["user"]> & { id: string; role: "ADMIN" | "STAFF" };
};

/**
 * `STAFF`·`ADMIN`만 통과. 그 외·비로그인은 `/dashboard` 또는 로그인으로 보냄.
 *
 * @history
 * - 2026-05-03: 대시보드 경로에서 공유 서지(`books`) 편집 권한용 신규
 */
export async function requireStaffOrAdmin(): Promise<StaffOrAdminSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }
  const r = session.user.role;
  if (r !== "ADMIN" && r !== "STAFF") {
    redirect("/dashboard");
  }
  return session as StaffOrAdminSession;
}
