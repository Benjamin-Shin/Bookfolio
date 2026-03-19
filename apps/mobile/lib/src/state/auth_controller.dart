import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthController extends ChangeNotifier {
  Session? _session;
  bool _isLoading = false;
  String? _error;

  Session? get session => _session;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _session != null;

  Future<void> restoreSession() async {
    _session = Supabase.instance.client.auth.currentSession;
    notifyListeners();
  }

  Future<void> signIn({required String email, required String password}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await Supabase.instance.client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      _session = result.session;
    } on AuthException catch (error) {
      _error = error.message;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signUp({required String email, required String password}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await Supabase.instance.client.auth.signUp(email: email, password: password);
      _error = '가입 확인 메일을 확인해주세요.';
    } on AuthException catch (error) {
      _error = error.message;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await Supabase.instance.client.auth.signOut();
    _session = null;
    notifyListeners();
  }
}

