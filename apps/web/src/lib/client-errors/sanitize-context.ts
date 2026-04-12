/**
 * 클라이언트 오류 context JSON에서 이메일·Bearer·JWT 형태 문자열을 마스킹합니다.
 *
 * @history
 * - 2026-04-10: 신규
 */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const JWT_LIKE_RE = /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9._\-]+/gi;

const MAX_DEPTH = 10;
const MAX_KEYS_PER_OBJECT = 80;
const MAX_STRING_LEN = 8000;

export function maskSensitivePlainText(s: string): string {
  let out = s;
  out = out.replace(EMAIL_RE, "[REDACTED_EMAIL]");
  out = out.replace(BEARER_RE, "Bearer [REDACTED]");
  out = out.replace(JWT_LIKE_RE, "[REDACTED_JWT]");
  if (out.length > MAX_STRING_LEN) {
    out = `${out.slice(0, MAX_STRING_LEN)}…[truncated]`;
  }
  return out;
}

export function sanitizeClientErrorContext(raw: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return "[max_depth]";
  }
  if (raw === null || raw === undefined) {
    return raw;
  }
  if (typeof raw === "string") {
    return maskSensitivePlainText(raw);
  }
  if (typeof raw === "number" || typeof raw === "boolean") {
    return raw;
  }
  if (Array.isArray(raw)) {
    return raw.slice(0, 100).map((item) => sanitizeClientErrorContext(item, depth + 1));
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const keys = Object.keys(o).slice(0, MAX_KEYS_PER_OBJECT);
    const next: Record<string, unknown> = {};
    for (const k of keys) {
      next[k] = sanitizeClientErrorContext(o[k], depth + 1);
    }
    return next;
  }
  return String(raw);
}
