import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

import { UserNameForm } from "./user-name-form";
import { UserRoleForm } from "./user-role-form";

type AppUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  app_profiles: { display_name: string | null } | { display_name: string | null }[] | null;
};

function effectiveUserDisplayName(row: AppUserRow): string | null {
  const prof = row.app_profiles;
  const fromProfile = Array.isArray(prof) ? prof[0]?.display_name : prof?.display_name;
  return (fromProfile ?? row.name) ?? null;
}

/**
 * 관리자 전용 사용자 목록 페이지.
 *
 * @history
 * - 2026-03-24: 이름 컬럼에 인라인 편집(`UserNameForm`) 및 프로필 표시명 조회
 */
export default async function AdminUsersPage() {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { data: rows, error } = await supabase
    .from("app_users")
    .select("id,email,name,role,created_at,app_profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <p className="text-sm text-destructive">
        사용자 목록을 불러오지 못했습니다: {error.message}
      </p>
    );
  }

  const users = (rows ?? []) as AppUserRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">사용자 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          최근 가입 순(최대 500명). 첫 관리자는 DB에서 직접{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">role = &apos;ADMIN&apos;</code>으로 지정하세요.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/80">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">이메일</th>
              <th className="px-3 py-2 font-medium">이름</th>
              <th className="px-3 py-2 font-medium">가입일</th>
              <th className="px-3 py-2 font-medium">권한</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const role = u.role === "ADMIN" ? "ADMIN" : "USER";
              return (
                <tr key={u.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                  <td className="px-3 py-2 align-middle">
                    <UserNameForm userId={u.id} initialName={effectiveUserDisplayName(u)} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {new Date(u.created_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-3 py-2">
                    <UserRoleForm userId={u.id} currentRole={role} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
