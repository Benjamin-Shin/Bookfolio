import {
  USER_FEEDBACK_CATEGORIES,
  type UserFeedbackCategory,
  USER_FEEDBACK_PLATFORMS,
  type UserFeedbackPlatform,
} from "@bookfolio/shared";

const MAX_BODY = 4000;
const MAX_CONTACT_EMAIL = 320;
const MAX_APP_VERSION = 64;

export type ParsedUserFeedbackInput = {
  category: UserFeedbackCategory;
  body: string;
  contactEmail: string | null;
  platform: UserFeedbackPlatform;
  appVersion: string | null;
  deviceInfo: Record<string, unknown>;
};

function parseCategory(raw: unknown): UserFeedbackCategory {
  if (typeof raw === "string" && (USER_FEEDBACK_CATEGORIES as readonly string[]).includes(raw)) {
    return raw as UserFeedbackCategory;
  }
  return "other";
}

function parsePlatform(raw: unknown): UserFeedbackPlatform {
  if (typeof raw === "string" && (USER_FEEDBACK_PLATFORMS as readonly string[]).includes(raw)) {
    return raw as UserFeedbackPlatform;
  }
  return "unknown";
}

function parseDeviceInfo(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== "string" || k.length > 64) {
      continue;
    }
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean" ||
      v === null
    ) {
      out[k] = typeof v === "string" ? v.slice(0, 500) : v;
    }
  }
  return out;
}

/**
 * `POST /api/me/feedback` 본문 파싱·길이 제한.
 *
 * @history
 * - 2026-05-18: 신규
 */
export function parseUserFeedbackInput(body: unknown): ParsedUserFeedbackInput | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid body" };
  }
  const o = body as Record<string, unknown>;
  const bodyRaw = o.body;
  if (typeof bodyRaw !== "string" || bodyRaw.trim().length === 0) {
    return { error: "의견 내용을 입력해 주세요." };
  }
  const trimmedBody = bodyRaw.trim().slice(0, MAX_BODY);
  if (trimmedBody.length < 4) {
    return { error: "의견은 4자 이상 입력해 주세요." };
  }

  let contactEmail: string | null = null;
  if (typeof o.contactEmail === "string") {
    const e = o.contactEmail.trim().slice(0, MAX_CONTACT_EMAIL);
    if (e.length > 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        return { error: "연락 이메일 형식이 올바르지 않습니다." };
      }
      contactEmail = e;
    }
  }

  let appVersion: string | null = null;
  if (typeof o.appVersion === "string") {
    const v = o.appVersion.trim().slice(0, MAX_APP_VERSION);
    appVersion = v.length > 0 ? v : null;
  }

  return {
    category: parseCategory(o.category),
    body: trimmedBody,
    contactEmail,
    platform: parsePlatform(o.platform),
    appVersion,
    deviceInfo: parseDeviceInfo(o.deviceInfo),
  };
}
