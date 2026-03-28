import 'package:bookfolio_mobile/src/theme/bookfolio_themes.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// `MaterialApp.theme` / `themeMode` / 팔레트. 로컬에 저장한다.
///
/// History:
/// - 2026-03-28: `ThemeMode`·`BookfolioPalette` 영속화
class ThemeController extends ChangeNotifier {
  static const _modeKey = 'bookfolio_theme_mode';
  static const _paletteKey = 'bookfolio_palette';

  ThemeMode _themeMode = ThemeMode.system;
  BookfolioPalette _palette = BookfolioPalette.warm;

  ThemeMode get themeMode => _themeMode;
  BookfolioPalette get palette => _palette;

  /// 앱 시작 시 한 번 호출해 저장값을 불러온다.
  Future<void> restore() async {
    final prefs = await SharedPreferences.getInstance();
    _themeMode = _parseThemeMode(prefs.getString(_modeKey));
    _palette = _parsePalette(prefs.getString(_paletteKey));
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    _themeMode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_modeKey, mode.name);
  }

  Future<void> setPalette(BookfolioPalette next) async {
    if (_palette == next) return;
    _palette = next;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_paletteKey, next.name);
  }

  static ThemeMode _parseThemeMode(String? raw) {
    if (raw == null || raw.isEmpty) return ThemeMode.system;
    for (final m in ThemeMode.values) {
      if (m.name == raw) return m;
    }
    return ThemeMode.system;
  }

  static BookfolioPalette _parsePalette(String? raw) {
    if (raw == null || raw.isEmpty) return BookfolioPalette.warm;
    for (final p in BookfolioPalette.values) {
      if (p.name == raw) return p;
    }
    return BookfolioPalette.warm;
  }
}
