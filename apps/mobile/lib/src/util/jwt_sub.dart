import 'dart:convert';

/// Bearer 액세스 토큰(JWT) 페이로드에서 `sub`만 꺼냅니다(로컬 캐시 파티션용, 서명 검증 없음).
///
/// @history
/// - 2026-04-08: 오프라인 미러 `ownerUserId`와 프로필 `id` 정렬용
String? jwtSubjectFromAccessToken(String? token) {
  if (token == null || token.isEmpty) return null;
  final parts = token.split('.');
  if (parts.length != 3) return null;
  try {
    final payload = jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))));
    if (payload is Map<String, dynamic>) {
      final sub = payload['sub'];
      if (sub is String && sub.isNotEmpty) return sub;
    }
  } catch (_) {}
  return null;
}
