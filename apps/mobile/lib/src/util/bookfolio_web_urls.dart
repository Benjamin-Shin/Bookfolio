/// `BOOKFOLIO_API_BASE_URL`과 동일 호스트의 웹 페이지 URL을 만듭니다.
///
/// History:
/// - 2026-05-12: 드로어에서 `/cookies` 링크 제거 — 주석만 정리(웹 절대 URL 유틸은 유지)
/// - 2026-03-29: 개인정보·약관·쿠키 정책 브라우저 링크용
String bookfolioWebOrigin() {
  const raw = String.fromEnvironment('BOOKFOLIO_API_BASE_URL');
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return '';
  final uri = Uri.parse(trimmed);
  if (!uri.hasScheme || uri.host.isEmpty) return '';
  return uri.origin;
}

/// [path]는 `/privacy`처럼 선행 슬래시를 포함하는 것을 권장합니다.
Uri bookfolioWebPageUri(String path) {
  final origin = bookfolioWebOrigin();
  final p = path.startsWith('/') ? path : '/$path';
  if (origin.isEmpty) {
    return Uri.parse(p);
  }
  return Uri.parse('$origin$p');
}
