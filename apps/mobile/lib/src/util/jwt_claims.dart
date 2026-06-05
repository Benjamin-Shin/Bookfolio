import 'dart:convert';

/// 모바일 JWT 정책 상수 — 서버 `mobile-jwt.ts`와 동일하게 유지.
///
/// @history
/// - 2026-06-05: sliding refresh 기준(7일·grace·90일 상한)
const Duration mobileJwtRefreshThreshold = Duration(days: 7);
const Duration mobileJwtExpiredGrace = Duration(days: 7);
const Duration mobileJwtAbsoluteMax = Duration(days: 90);
const Duration mobileJwtRefreshDebounce = Duration(hours: 6);

/// Bearer JWT 페이로드에서 `sub`·`iat`·`exp`를 파싱합니다(서명 검증 없음).
class JwtClaims {
  const JwtClaims({
    this.subject,
    this.issuedAt,
    this.expiresAt,
  });

  final String? subject;
  final DateTime? issuedAt;
  final DateTime? expiresAt;
}

DateTime? _jwtSecondsToUtc(int? seconds) {
  if (seconds == null) return null;
  return DateTime.fromMillisecondsSinceEpoch(seconds * 1000, isUtc: true);
}

/// @history
/// - 2026-06-05: refresh 정책 판단용
JwtClaims? jwtClaimsFromAccessToken(String? token) {
  if (token == null || token.isEmpty) return null;
  final parts = token.split('.');
  if (parts.length != 3) return null;
  try {
    final payload =
        jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))));
    if (payload is! Map<String, dynamic>) return null;
    final sub = payload['sub'];
    final iat = payload['iat'];
    final exp = payload['exp'];
    return JwtClaims(
      subject: sub is String && sub.isNotEmpty ? sub : null,
      issuedAt: _jwtSecondsToUtc(iat is int ? iat : (iat is num ? iat.toInt() : null)),
      expiresAt: _jwtSecondsToUtc(exp is int ? exp : (exp is num ? exp.toInt() : null)),
    );
  } catch (_) {
    return null;
  }
}

/// refresh API 호출이 필요한지(만료 grace 이내 또는 `exp` 7일 미만).
///
/// @history
/// - 2026-06-05: `AuthController.maybeRefreshSession`용
bool mobileJwtShouldProactiveRefresh(String token, {DateTime? now}) {
  final claims = jwtClaimsFromAccessToken(token);
  final exp = claims?.expiresAt;
  if (exp == null) return false;
  final utcNow = (now ?? DateTime.now()).toUtc();

  final iat = claims?.issuedAt;
  if (iat != null && utcNow.difference(iat) > mobileJwtAbsoluteMax) {
    return false;
  }

  if (utcNow.isAfter(exp.add(mobileJwtExpiredGrace))) {
    return false;
  }

  if (utcNow.isAfter(exp)) {
    return true;
  }

  return exp.difference(utcNow) < mobileJwtRefreshThreshold;
}

/// 로컬 저장 토큰을 세션으로 쓸 수 있는지(grace·absolute max).
///
/// @history
/// - 2026-06-05: `restoreSession` 폐기 판단
bool mobileJwtIsStoredTokenUsable(String token, {DateTime? now}) {
  final claims = jwtClaimsFromAccessToken(token);
  final exp = claims?.expiresAt;
  if (exp == null) return true;
  final utcNow = (now ?? DateTime.now()).toUtc();

  final iat = claims?.issuedAt;
  if (iat != null && utcNow.difference(iat) > mobileJwtAbsoluteMax) {
    return false;
  }

  return !utcNow.isAfter(exp.add(mobileJwtExpiredGrace));
}
