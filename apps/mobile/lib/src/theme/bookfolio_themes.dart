import 'package:flutter/material.dart';

/// 앱 전역 라이트·다크 테마와 악센트 팔레트.
///
/// History:
/// - 2026-03-28: `BookfolioPalette`(웜/세이지), `light`/`dark` 팩토리
enum BookfolioPalette {
  /// 기존 북폴리오 웜 톤(주황·갈색 계열).
  warm,

  /// 책·숲 느낌의 차분한 세이지 그린.
  sage,
}

extension BookfolioPaletteX on BookfolioPalette {
  Color get seedColor => switch (this) {
        BookfolioPalette.warm => const Color(0xFFB3582F),
        BookfolioPalette.sage => const Color(0xFF4A6B56),
      };

  Color get lightScaffold => switch (this) {
        BookfolioPalette.warm => const Color(0xFFF7F0E7),
        BookfolioPalette.sage => const Color(0xFFF0F5F1),
      };
}

class BookfolioThemes {
  BookfolioThemes._();

  static ThemeData light(BookfolioPalette palette) {
    final seed = palette.seedColor;
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: seed,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: palette.lightScaffold,
      useMaterial3: true,
    );
  }

  static ThemeData dark(BookfolioPalette palette) {
    final seed = palette.seedColor;
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: seed,
        brightness: Brightness.dark,
      ),
      scaffoldBackgroundColor: const Color(0xFF141210),
      useMaterial3: true,
    );
  }
}
