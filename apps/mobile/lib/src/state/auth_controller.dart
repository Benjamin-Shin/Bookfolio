import 'dart:convert';

import 'package:flutter/foundation.dart';
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

  static const _apiBase = String.fromEnvironment('BOOKFOLIO_API_BASE_URL');

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

  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    _session = null;
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
