import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthSession {
  AuthSession(this.accessToken);
  final String accessToken;
}

class AuthController extends ChangeNotifier {
  static const _tokenKey = 'bookfolio_access_token';

  AuthSession? _session;
  bool _isLoading = false;
  String? _error;

  AuthSession? get session => _session;
  bool get isLoading => _isLoading;
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
  static const _googleAuthClientId = String.fromEnvironment('GOOGLE_AUTH_CLIENT_ID');

  Uri _apiUri(String path) {
    final base = _apiBase.trim().replaceAll(RegExp(r'/+$'), '');
    return Uri.parse('$base$path');
  }

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_tokenKey);
    _session = (raw != null && raw.isNotEmpty) ? AuthSession(raw) : null;
    notifyListeners();
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
        debugPrint('[auth] login status=${response.statusCode} bodyLen=${response.body.length}');
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final map = jsonDecode(response.body) as Map<String, dynamic>;
        final token = map['accessToken'] as String?;
        if (token == null || token.isEmpty) {
          _error = '서버 응답이 올바르지 않습니다.';
        } else {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_tokenKey, token);
          _session = AuthSession(token);
        }
      } else {
        _error = _parseErrorBody(response.body) ?? '로그인에 실패했습니다. (${response.statusCode})';
      }
    } on Exception catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signUp({required String email, required String password}) async {
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
      final response = await http.post(
        url,
        headers: const {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        _error = '가입되었습니다. 로그인해 주세요.';
      } else {
        _error = _parseErrorBody(response.body) ?? '가입에 실패했습니다. (${response.statusCode})';
      }
    } on Exception catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
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
        debugPrint('[auth] google status=${response.statusCode} bodyLen=${response.body.length}');
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final map = jsonDecode(response.body) as Map<String, dynamic>;
        final token = map['accessToken'] as String?;
        if (token == null || token.isEmpty) {
          _error = '서버 응답이 올바르지 않습니다.';
        } else {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_tokenKey, token);
          _session = AuthSession(token);
        }
      } else {
        _error = _parseErrorBody(response.body) ?? 'Google 로그인에 실패했습니다. (${response.statusCode})';
      }
    } on Exception catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    _session = null;
    try {
      await GoogleSignIn().signOut();
    } catch (_) {}
    notifyListeners();
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
}
