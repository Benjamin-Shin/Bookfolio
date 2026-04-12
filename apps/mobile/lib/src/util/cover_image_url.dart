import 'package:flutter/foundation.dart' show kIsWeb;

/// iOS ATS · Android cleartext 제한을 피하기 위해 `http://` → `https://` 로 맞춥니다.
/// DB/API에 예전 형식이 남아 있어도 표시 단계에서 보정합니다.
String? resolveCoverImageUrl(String? raw) {
  if (raw == null) return null;
  final t = raw.trim();
  if (t.isEmpty) return null;
  var u = t;
  if (u.startsWith('http://')) {
    u = 'https://${u.substring(7)}';
  } else if (u.startsWith('//')) {
    u = 'https:$u';
  }
  final uri = Uri.tryParse(u);
  if (uri == null || !uri.hasScheme) return null;
  if (uri.scheme != 'http' && uri.scheme != 'https') return null;
  if (uri.host.isEmpty) return null;
  return uri.toString();
}

/// 일부 표지 CDN이 비브라우저 클라이언트를 차단하는 경우가 있어 모바일·데스크톱 빌드에는 UA를 붙입니다.
///
/// 웹(`kIsWeb`)에서는 브라우저가 `User-Agent` 등을 스크립트에서 설정하는 것을 막아
/// `Refused to set unsafe header "User-Agent"` 가 나므로 빈 맵을 씁니다.
///
/// @history
/// - 2026-04-03: Flutter 웹 — 금지 헤더 제거
Map<String, String> get kCoverImageRequestHeaders =>
    kIsWeb
        ? const <String, String>{}
        : const <String, String>{
            'User-Agent':
                'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          };
