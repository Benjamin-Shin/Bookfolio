import { appUserExistsById, findAppUserIdByEmail } from "@/lib/auth/app-users";

/** RFC 4122 형태 UUID (관리자 입력 검증용). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ResolveRecipientResult =
  | { ok: true; userId: string }
  | { ok: false; message: string };

/**
 * 관리자 알림 수신자 문자열(UUID 또는 가입 이메일)을 `app_users.id`로 해석합니다.
 *
 * @history
 * - 2026-05-04: 신규 — 공지 관리 화면·API 공통
 */
export async function resolveAdminNotificationRecipient(raw: string): Promise<ResolveRecipientResult> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: "수신자(사용자 ID 또는 이메일)를 입력하세요." };
  }

  if (UUID_RE.test(trimmed)) {
    const exists = await appUserExistsById(trimmed);
    if (!exists) {
      return { ok: false, message: "해당 사용자 ID가 없습니다." };
    }
    return { ok: true, userId: trimmed };
  }

  const byEmail = await findAppUserIdByEmail(trimmed);
  if (!byEmail) {
    return { ok: false, message: "해당 이메일로 가입한 사용자가 없습니다." };
  }
  return { ok: true, userId: byEmail };
}
