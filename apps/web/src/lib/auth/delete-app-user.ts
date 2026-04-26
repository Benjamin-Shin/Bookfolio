import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * 탈퇴가 막혀야 할 때(모임서가 정리 필요 등).
 *
 * @history
 * - 2026-03-26: 소유 모임서가·타 멤버 선행 조건
 */
export class AccountDeleteBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountDeleteBlockedError";
  }
}

/**
 * `created_by`인 모임서가에 본인 외 멤버가 있는 서가 이름 목록(탈퇴 UI 비활성화·안내용).
 * 빈 배열이면 해당 사유로 탈퇴가 막히지 않습니다.
 *
 * @history
 * - 2026-03-29: 프로필 탈퇴 버튼 비활성화와 동일 조건 노출
 * - 2026-03-26: 신규 — `assertAccountDeleteAllowed`와 동일 쿼리
 */
export async function listOwnedSharedLibrariesBlockingWithdrawal(
  userId: string,
): Promise<string[]> {
  const supabase = createSupabaseAdminClient();
  const { data: owned, error } = await supabase
    .from("libraries")
    .select("id, name")
    .eq("created_by", userId);

  if (error) {
    throw error;
  }

  const libs = owned ?? [];
  if (libs.length === 0) {
    return [];
  }

  const namesWithOtherMembers: string[] = [];

  for (const lib of libs) {
    const libraryId = lib.id as string;
    const { count, error: cErr } = await supabase
      .from("library_members")
      .select("*", { count: "exact", head: true })
      .eq("library_id", libraryId)
      .neq("user_id", userId);

    if (cErr) {
      throw cErr;
    }
    if ((count ?? 0) > 0) {
      namesWithOtherMembers.push(
        (lib.name as string)?.trim() || "이름 없는 서가",
      );
    }
  }

  return namesWithOtherMembers;
}

/**
 * `created_by`인 모임서가에 본인 외 멤버가 있으면 탈퇴 불가(소유권 이전 필요).
 * 본인만 남은 소유 서가는 탈투 시 서버에서 자동 삭제합니다.
 *
 * @history
 * - 2026-03-29: `listOwnedSharedLibrariesBlockingWithdrawal` 위임
 * - 2026-03-26: 본인만 남은 서가는 자동 삭제, 타 멤버 있으면 소유권 이전 안내
 * - 2026-03-26: 신규
 */
export async function assertAccountDeleteAllowed(
  userId: string,
): Promise<void> {
  const namesWithOtherMembers =
    await listOwnedSharedLibrariesBlockingWithdrawal(userId);

  if (namesWithOtherMembers.length > 0) {
    throw new AccountDeleteBlockedError(
      `소유 중인 모임서가에 다른 멤버가 있습니다. 서가 설정에서 소유권을 다른 멤버에게 이전한 뒤 탈퇴해 주세요. (${namesWithOtherMembers.join(", ")})`,
    );
  }
}

/**
 * `app_users` 한 행을 물리 삭제합니다. 연쇄 정리(CASCADE) 여부는 FK 정의에 따릅니다.
 * 마이그레이션 `0023` 적용 후: 본인이 만든 `libraries`·멤버십·`user_books`·포인트 원장·한줄평 등 사용자 데이터가 함께 제거됩니다.
 * 공유 서지(`books`) 행은 삭제되지 않습니다.
 *
 * @history
 * - 2026-03-26: 본인 단독 소유 모임서가는 `libraries.created_by` CASCADE로 사용자 삭제 시 함께 삭제됨(선행 검증만 유지)
 * - 2026-03-26: 모임서가 선행 조건 검증
 * - 2026-03-26: 회원 탈퇴 API용
 */
export async function deleteAppUserById(userId: string): Promise<void> {
  await assertAccountDeleteAllowed(userId);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("app_users").delete().eq("id", userId);
  if (error) {
    throw error;
  }
}
