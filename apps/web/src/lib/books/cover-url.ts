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
