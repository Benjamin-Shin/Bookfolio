import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// `MaterialApp.theme` / `themeMode`. 로컬에 저장한다.
///
/// History:
/// - 2026-04-12: `BookfolioPalette` 제거 — `#Reference/DESIGN.md` 단일 테마
/// - 2026-03-28: `ThemeMode`·`BookfolioPalette` 영속화
class ThemeController extends ChangeNotifier {
  static const _modeKey = 'bookfolio_theme_mode';

  ThemeMode _themeMode = ThemeMode.system;

  ThemeMode get themeMode => _themeMode;

  /// 앱 시작 시 한 번 호출해 저장값을 불러온다.
  Future<void> restore() async {
    final prefs = await SharedPreferences.getInstance();
    _themeMode = _parseThemeMode(prefs.getString(_modeKey));
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    _themeMode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_modeKey, mode.name);
  }

  static ThemeMode _parseThemeMode(String? raw) {
    if (raw == null || raw.isEmpty) return ThemeMode.system;
    for (final m in ThemeMode.values) {
      if (m.name == raw) return m;
    }
    return ThemeMode.system;
  }
}
