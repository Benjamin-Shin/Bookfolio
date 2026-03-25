/**
 * 모바일 앱(iOS ATS, Android cleartext 정책)에서도 표지를 불러오도록
 * API로 내려주기 전에 URL을 정리합니다.
 */
export function normalizeCoverUrlForClient(url: string | null | undefined): string | null {
  if (url == null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://")) {
    return `https://${trimmed.slice(7)}`;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return trimmed;
}

/**
 * 배달 URL이 Cloudinary(`res.cloudinary.com`)인지 여부.
 *
 * @history
 * - 2026-03-25: 신규 — 편집 화면에서 외부 표지 URL Cloudinary 이관 UX
 */
export function isCloudinaryHostedCoverUrl(url: string | null | undefined): boolean {
  if (url == null) {
    return false;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    return host === "res.cloudinary.com" || host.endsWith(".res.cloudinary.com");
  } catch {
    return false;
  }
}
