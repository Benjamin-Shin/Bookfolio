import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:kakao_flutter_sdk_user/kakao_flutter_sdk_user.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

class AuthSession {
  AuthSession(this.accessToken);
  final String accessToken;
}

/// Bearer 세션, 이메일·Google 로그인, 이메일 가입.
///
/// History:
/// - 2026-04-26: `startWebSessionTransfer`/`openWebSessionTransfer` 추가 — 모바일 세션을 웹 로그인 URL로 전이
/// - 2026-04-25: 카카오 로그인 시 이메일 스코프 부족(`account_email`)이면 `loginWithNewScopes`로 재동의 후 토큰 교환 재시도
/// - 2026-04-24: `signInWithKakao` 추가 — 카카오 SDK 토큰을 `/api/auth/mobile/kakao`로 교환
/// - 2026-04-12: `signIn`/`signUp` — 기본 오류 메시지 `??=` (lint)
/// - 2026-04-05: `signUp` 자동 로그인·`/api/upload` 아바타·`/api/me/profile` 인구통계 반영
class AuthController extends ChangeNotifier {
  static const _tokenKey = 'bookfolio_access_token';
  static const _secureStorage = FlutterSecureStorage();

  AuthSession? _session;
  bool _isLoading = false;
  bool _isRestoring = true;
  String? _error;

  AuthSession? get session => _session;
  bool get isLoading => _isLoading;
  bool get isRestoring => _isRestoring;
  String? get error => _error;
  bool get isAuthenticated => _session != null;

  /// 로그인 화면 등에서 검증 오류 배너를 닫을 때 사용합니다.
  ///
  /// History:
  /// - 2026-03-28: 회원가입/로그인 전환 시 메시지 초기화용
  void clearError() {
    if (_error == null) return;
    _error = null;
    notifyListeners();
  }

  static const _apiBase = String.fromEnvironment('BOOKFOLIO_API_BASE_URL');

  /// 서버 `AUTH_GOOGLE_ID`(웹 클라이언트 ID)와 같게 두면 ID 토큰 aud 검증이 맞습니다.
  /// 비우면 네이티브 클라이언트 aud 만 쓰게 되므로 서버에 `AUTH_GOOGLE_MOBILE_AUDIENCES` 로 해당 ID를 추가해야 합니다.
  static const _googleAuthClientId =
      String.fromEnvironment('GOOGLE_AUTH_CLIENT_ID');

  Uri _apiUri(String path) {
    final base = _apiBase.trim().replaceAll(RegExp(r'/+$'), '');
    return Uri.parse('$base$path');
  }

  Future<void> restoreSession() async {
    _isRestoring = true;
    notifyListeners();
    try {
      String? raw = await _secureStorage.read(key: _tokenKey);
      if (raw == null || raw.isEmpty) {
        final prefs = await SharedPreferences.getInstance();
        final legacy = prefs.getString(_tokenKey);
        if (legacy != null && legacy.isNotEmpty) {
          raw = legacy;
          await _secureStorage.write(key: _tokenKey, value: legacy);
          await prefs.remove(_tokenKey);
        }
      }
      _session = (raw != null && raw.isNotEmpty) ? AuthSession(raw) : null;
    } catch (e) {
      _session = null;
      _error = '저장된 로그인 정보를 복원하지 못했습니다: $e';
    } finally {
      _isRestoring = false;
      notifyListeners();
    }
  }

  Future<void> signIn({required String email, required String password}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    if (_apiBase.trim().isEmpty) {
      _error =
          'BOOKFOLIO_API_BASE_URL 이 비어 있습니다. 실행 시 --dart-define=BOOKFOLIO_API_BASE_URL=<웹 URL> 을 넣거나 VS Code launch.json 의 toolArgs 를 확인하세요.';
      _isLoading = false;
      notifyListeners();
      return;
    }

    try {
      final token =
          await _exchangePasswordForToken(email: email, password: password);
      if (token != null) {
        await _storeAccessToken(token);
      } else {
        _error ??= '로그인에 실패했습니다.';
      }
    } on PlatformException catch (e) {
      _error = _mapGoogleSignInPlatformError(e);
    } on Exception catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// 비밀번호 로그인으로 액세스 토큰만 받습니다. 실패 시 [ _error ]를 채우고 `null`을 반환합니다.
  ///
  /// @history
  /// - 2026-04-05: 가입 직후 자동 로그인·프로필 보강용으로 분리
  Future<String?> _exchangePasswordForToken({
    required String email,
    required String password,
  }) async {
    final url = _apiUri('/api/auth/mobile/login');
    if (kDebugMode) {
      debugPrint('[auth] POST $url');
    }
    final response = await http.post(
      url,
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (kDebugMode) {
      debugPrint(
          '[auth] login status=${response.statusCode} bodyLen=${response.body.length}');
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final map = jsonDecode(response.body) as Map<String, dynamic>;
      final token = map['accessToken'] as String?;
      if (token == null || token.isEmpty) {
        _error = '서버 응답이 올바르지 않습니다.';
        return null;
      }
      return token;
    }
    _error = _parseErrorBody(response.body) ??
        '로그인에 실패했습니다. (${response.statusCode})';
    return null;
  }

  Future<void> _storeAccessToken(String token) async {
    await _secureStorage.write(key: _tokenKey, value: token);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    _session = AuthSession(token);
  }

  /// 이메일 가입 후 자동 로그인합니다. 선택 프로필(이름·성별·생일·아바타)은 로그인 뒤 API로 반영합니다.
  ///
  /// [name] 은 `POST /api/auth/register` 본문의 `name` 과 같으며, DB상 `app_users.name`·`app_profiles.display_name`(표시 이름)에 들어갑니다.
  ///
  /// @history
  /// - 2026-04-05: `name`/인구통계/아바타(멀티파트 업로드) 연동·가입 직후 세션 확보
  /// - 2026-04-05: 가입 표시 이름 파라미터를 API 필드명과 동일하게 `name` 으로 통일(닉네임과 동의어)
  Future<void> signUp({
    required String email,
    required String password,
    String? name,
    String? gender,
    String? birthDateIso,
    List<int>? avatarBytes,
    String? avatarFileName,
    String? avatarMimeType,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    if (_apiBase.trim().isEmpty) {
      _error =
          'BOOKFOLIO_API_BASE_URL 이 비어 있습니다. 실행 시 --dart-define=BOOKFOLIO_API_BASE_URL=<웹 URL> 을 넣으세요.';
      _isLoading = false;
      notifyListeners();
      return;
    }

    try {
      final url = _apiUri('/api/auth/register');
      if (kDebugMode) {
        debugPrint('[auth] POST $url (register)');
      }

      final regPayload = <String, dynamic>{
        'email': email,
        'password': password,
      };
      final trimmedName = name?.trim();
      if (trimmedName != null && trimmedName.isNotEmpty) {
        regPayload['name'] = trimmedName;
      }

      final response = await http.post(
        url,
        headers: const {'Content-Type': 'application/json'},
        body: jsonEncode(regPayload),
      );

      if (response.statusCode < 200 || response.statusCode >= 300) {
        _error = _parseErrorBody(response.body) ??
            '가입에 실패했습니다. (${response.statusCode})';
        return;
      }

      _error = null;
      final token =
          await _exchangePasswordForToken(email: email, password: password);
      if (token == null) {
        _error ??= '가입은 되었으나 자동 로그인에 실패했습니다. 로그인을 시도해 주세요.';
        return;
      }

      await _storeAccessToken(token);

      String? avatarUrl;
      final bytes = avatarBytes;
      if (bytes != null && bytes.isNotEmpty) {
        avatarUrl = await _tryUploadAvatar(
          accessToken: token,
          bytes: bytes,
          fileName: (avatarFileName?.trim().isNotEmpty ?? false)
              ? avatarFileName!.trim()
              : 'avatar.jpg',
          mimeType: (avatarMimeType?.trim().isNotEmpty ?? false)
              ? avatarMimeType!.trim()
              : 'image/jpeg',
        );
      }

      final g = gender?.trim();
      final bd = birthDateIso?.trim();
      final hasDemographics = (g != null && g.isNotEmpty) ||
          (bd != null && bd.isNotEmpty) ||
          (avatarUrl != null && avatarUrl.isNotEmpty);

      if (hasDemographics) {
        await _tryPatchProfileAfterSignup(
          accessToken: token,
          avatarUrl: avatarUrl,
          gender: (g != null && g.isNotEmpty) ? g : null,
          birthDateIso: (bd != null && bd.isNotEmpty) ? bd : null,
        );
      }
    } on Exception catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<String?> _tryUploadAvatar({
    required String accessToken,
    required List<int> bytes,
    required String fileName,
    required String mimeType,
  }) async {
    try {
      final uri = _apiUri('/api/upload');
      final req = http.MultipartRequest('POST', uri);
      req.headers['Authorization'] = 'Bearer $accessToken';
      req.fields['kind'] = 'avatar';
      req.files.add(
        http.MultipartFile.fromBytes(
          'file',
          bytes,
          filename: fileName,
          contentType: MediaType.parse(mimeType),
        ),
      );
      final streamed = await req.send();
      final resp = await http.Response.fromStream(streamed);
      if (resp.statusCode < 200 || resp.statusCode >= 300) {
        if (kDebugMode) {
          debugPrint(
              '[auth] avatar upload status=${resp.statusCode} body=${resp.body}');
        }
        return null;
      }
      final map = jsonDecode(resp.body) as Map<String, dynamic>;
      final u = map['url'] as String?;
      return (u != null && u.isNotEmpty) ? u : null;
    } on Exception catch (e) {
      if (kDebugMode) {
        debugPrint('[auth] avatar upload error: $e');
      }
      return null;
    }
  }

  Future<void> _tryPatchProfileAfterSignup({
    required String accessToken,
    String? avatarUrl,
    String? gender,
    String? birthDateIso,
  }) async {
    final body = <String, dynamic>{'action': 'update'};
    if (avatarUrl != null && avatarUrl.isNotEmpty) {
      body['avatarUrl'] = avatarUrl;
    }
    if (gender != null && gender.isNotEmpty) {
      body['gender'] = gender;
    }
    if (birthDateIso != null && birthDateIso.isNotEmpty) {
      body['birthDate'] = birthDateIso;
    }
    if (body.length <= 1) {
      return;
    }

    try {
      final resp = await http.post(
        _apiUri('/api/me/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode(body),
      );
      if (kDebugMode && (resp.statusCode < 200 || resp.statusCode >= 300)) {
        debugPrint(
            '[auth] profile update status=${resp.statusCode} body=${resp.body}');
      }
    } on Exception catch (e) {
      if (kDebugMode) {
        debugPrint('[auth] profile update error: $e');
      }
    }
  }

  Future<void> signInWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    if (_apiBase.trim().isEmpty) {
      _error =
          'BOOKFOLIO_API_BASE_URL 이 비어 있습니다. 실행 시 --dart-define=BOOKFOLIO_API_BASE_URL=<웹 URL> 을 넣거나 VS Code launch.json 의 toolArgs 를 확인하세요.';
      _isLoading = false;
      notifyListeners();
      return;
    }

    final serverId = _googleAuthClientId.trim();
    final google = GoogleSignIn(
      scopes: const ['email', 'profile'],
      serverClientId: serverId.isEmpty ? null : serverId,
    );

    try {
      final account = await google.signIn();
      if (account == null) {
        _isLoading = false;
        notifyListeners();
        return;
      }

      final ga = await account.authentication;
      final idToken = ga.idToken;
      if (idToken == null || idToken.isEmpty) {
        _error =
            'Google ID 토큰을 받지 못했습니다. --dart-define=GOOGLE_AUTH_CLIENT_ID= 를 웹 OAuth 클라이언트 ID(AUTH_GOOGLE_ID 와 동일)로 설정해 보세요.';
        _isLoading = false;
        notifyListeners();
        return;
      }

      final url = _apiUri('/api/auth/mobile/google');
      if (kDebugMode) {
        debugPrint('[auth] POST $url (google)');
      }
      final response = await http.post(
        url,
        headers: const {'Content-Type': 'application/json'},
        body: jsonEncode({'idToken': idToken}),
      );

      if (kDebugMode) {
        debugPrint(
            '[auth] google status=${response.statusCode} bodyLen=${response.body.length}');
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final map = jsonDecode(response.body) as Map<String, dynamic>;
        final token = map['accessToken'] as String?;
        if (token == null || token.isEmpty) {
          _error = '서버 응답이 올바르지 않습니다.';
        } else {
          await _storeAccessToken(token);
        }
      } else {
        _error = _parseErrorBody(response.body) ??
            'Google 로그인에 실패했습니다. (${response.statusCode})';
      }
    } on Exception catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signInWithKakao() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    if (_apiBase.trim().isEmpty) {
      _error =
          'BOOKFOLIO_API_BASE_URL 이 비어 있습니다. 실행 시 --dart-define=BOOKFOLIO_API_BASE_URL=<웹 URL> 을 넣거나 VS Code launch.json 의 toolArgs 를 확인하세요.';
      _isLoading = false;
      notifyListeners();
      return;
    }

    try {
      OAuthToken token;
      final installed = await isKakaoTalkInstalled();
      if (installed) {
        try {
          token = await UserApi.instance.loginWithKakaoTalk();
        } catch (_) {
          token = await UserApi.instance.loginWithKakaoAccount();
        }
      } else {
        token = await UserApi.instance.loginWithKakaoAccount();
      }

      final kakaoAccessToken = token.accessToken.trim();
      if (kakaoAccessToken.isEmpty) {
        _error = '카카오 액세스 토큰을 받지 못했습니다.';
        return;
      }

      final first = await _exchangeKakaoForMobileToken(kakaoAccessToken);
      if (first != null) {
        await _storeAccessToken(first);
        return;
      }

      // 이메일 추가 수집(account_email) 동의가 필요한 경우 재동의 후 재시도.
      if (_needsKakaoEmailScope(_error)) {
        final reGranted =
            await UserApi.instance.loginWithNewScopes(['account_email']);
        final second =
            await _exchangeKakaoForMobileToken(reGranted.accessToken.trim());
        if (second != null) {
          await _storeAccessToken(second);
          return;
        }
      }
    } on Exception catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<String?> _exchangeKakaoForMobileToken(String kakaoAccessToken) async {
    if (kakaoAccessToken.isEmpty) {
      _error = '카카오 액세스 토큰을 받지 못했습니다.';
      return null;
    }

    final url = _apiUri('/api/auth/mobile/kakao');
    if (kDebugMode) {
      debugPrint('[auth] POST $url (kakao)');
    }
    final response = await http.post(
      url,
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({'accessToken': kakaoAccessToken}),
    );

    if (kDebugMode) {
      debugPrint(
          '[auth] kakao status=${response.statusCode} bodyLen=${response.body.length}');
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final map = jsonDecode(response.body) as Map<String, dynamic>;
      final accessToken = map['accessToken'] as String?;
      if (accessToken == null || accessToken.isEmpty) {
        _error = '서버 응답이 올바르지 않습니다.';
        return null;
      }
      return accessToken;
    }

    _error = _parseErrorBody(response.body) ??
        '카카오 로그인에 실패했습니다. (${response.statusCode})';
    return null;
  }

  bool _needsKakaoEmailScope(String? message) {
    final m = message?.trim();
    if (m == null || m.isEmpty) return false;
    return m.contains('이메일 동의') ||
        m.contains('account_email') ||
        m.contains('KAKAO_EMAIL_SCOPE_REQUIRED');
  }

  Future<void> signOut() async {
    await _secureStorage.delete(key: _tokenKey);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    _session = null;
    try {
      await GoogleSignIn().signOut();
    } catch (_) {}
    try {
      await UserApi.instance.logout();
    } catch (_) {}
    notifyListeners();
  }

  /// 모바일 Bearer 세션으로 웹 자동 로그인 URL을 발급받아 반환합니다.
  ///
  /// @history
  /// - 2026-04-26: 신규 — `POST /api/auth/transfer/start` 호출
  Future<Uri?> startWebSessionTransfer({String callbackPath = '/dashboard'}) async {
    final token = _session?.accessToken.trim();
    if (token == null || token.isEmpty) {
      _error = '로그인이 필요합니다.';
      notifyListeners();
      return null;
    }

    final safePath = (callbackPath.startsWith('/') && !callbackPath.startsWith('//'))
        ? callbackPath
        : '/dashboard';

    try {
      final response = await http.post(
        _apiUri('/api/auth/transfer/start'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'callbackPath': safePath}),
      );
      if (response.statusCode < 200 || response.statusCode >= 300) {
        _error = _parseErrorBody(response.body) ?? '웹 로그인 연결에 실패했습니다. (${response.statusCode})';
        notifyListeners();
        return null;
      }
      final map = jsonDecode(response.body) as Map<String, dynamic>;
      final loginUrl = (map['loginUrl'] as String?)?.trim();
      if (loginUrl == null || loginUrl.isEmpty) {
        _error = '웹 로그인 URL 응답이 올바르지 않습니다.';
        notifyListeners();
        return null;
      }
      return Uri.tryParse(loginUrl);
    } on Exception catch (e) {
      _error = '웹 로그인 연결 중 오류가 발생했습니다: $e';
      notifyListeners();
      return null;
    }
  }

  /// 모바일 세션을 웹으로 전이하는 URL을 외부 브라우저로 엽니다.
  ///
  /// @history
  /// - 2026-04-26: 신규 — 로그인 전이 URL 발급 후 `launchUrl` 실행
  Future<bool> openWebSessionTransfer({String callbackPath = '/dashboard'}) async {
    final uri = await startWebSessionTransfer(callbackPath: callbackPath);
    if (uri == null) return false;
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok) {
      _error = '브라우저를 열지 못했습니다.';
      notifyListeners();
    }
    return ok;
  }

  String? _parseErrorBody(String body) {
    if (body.isEmpty) return null;
    try {
      final map = jsonDecode(body) as Map<String, dynamic>;
      return map['error'] as String?;
    } catch (_) {
      return null;
    }
  }

  String _mapGoogleSignInPlatformError(PlatformException e) {
    final code = e.code.trim();
    final message = (e.message ?? '').trim();
    final detail = (e.details ?? '').toString().trim();

    final isDeveloperConfigError = code == 'sign_in_failed' &&
        (message.contains('10') ||
            detail.contains('10') ||
            message.contains('DEVELOPER_ERROR') ||
            detail.contains('DEVELOPER_ERROR'));

    if (isDeveloperConfigError) {
      return '구글 로그인 설정 오류(개발자 구성, code 10)입니다. '
          'Google Cloud Console의 Android OAuth 클라이언트에 '
          '`app.bookfolio.seogadam` 패키지명과 현재 서명키 SHA-1(디버그/릴리즈)을 등록했는지 확인하세요. '
          '에뮬레이터에서는 Google Play 서비스가 최신인지도 점검해 주세요.';
    }

    if (code == 'network_error') {
      return '구글 로그인 중 네트워크 오류가 발생했습니다. 연결 상태를 확인하고 다시 시도해 주세요.';
    }

    return '구글 로그인에 실패했습니다. (${code.isEmpty ? 'unknown' : code})'
        '${message.isEmpty ? '' : ' $message'}';
  }
}
