import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';

/// 앱 전역 라이트·다크 테마. 색·타이포는 `#Reference/DESIGN.md` 단일 소스(`BookfolioDesignTokens`).
///
/// History:
/// - 2026-04-12: 웜/세이지 팔레트 제거 — 고정 `ColorScheme` + Manrope/Newsreader 텍스트 테마
/// - 2026-03-28: `BookfolioPalette`(웜/세이지), `light`/`dark` 팩토리
/// - 2026-04-05: 라이트 모드 베이스를 DESIGN.md 서피스·악센트로 정렬(`copyWith`)
class BookfolioThemes {
  BookfolioThemes._();

  static final ColorScheme _lightColorScheme = ColorScheme.light(
    primary: BookfolioDesignTokens.primary,
    onPrimary: BookfolioDesignTokens.onPrimary,
    primaryContainer: BookfolioDesignTokens.primaryContainer,
    onPrimaryContainer: BookfolioDesignTokens.onPrimaryContainer,
    secondary: BookfolioDesignTokens.secondary,
    onSecondary: BookfolioDesignTokens.onSecondary,
    secondaryContainer: BookfolioDesignTokens.secondaryContainer,
    onSecondaryContainer: BookfolioDesignTokens.onSecondaryContainer,
    tertiary: BookfolioDesignTokens.tertiary,
    onTertiary: BookfolioDesignTokens.onTertiary,
    surface: BookfolioDesignTokens.surface,
    onSurface: BookfolioDesignTokens.onSurface,
    error: const Color(0xFFB3261E),
    onError: Colors.white,
  ).copyWith(
    onSurfaceVariant: BookfolioDesignTokens.onSurfaceVariant,
    outline: BookfolioDesignTokens.outlineVariant.withValues(alpha: 0.35),
    outlineVariant: BookfolioDesignTokens.outlineVariant,
    surfaceContainerLowest: BookfolioDesignTokens.surfaceContainerLowest,
    surfaceContainerLow: BookfolioDesignTokens.surfaceContainerLow,
    surfaceContainerHigh: BookfolioDesignTokens.surfaceContainerHigh,
    surfaceContainerHighest: BookfolioDesignTokens.surfaceContainerHighest,
  );

  /// 라이트 테마(서가담 에디토리얼 고정).
  static ThemeData light() {
    final colorScheme = _lightColorScheme;
    final base = ThemeData(
      colorScheme: colorScheme,
      scaffoldBackgroundColor: BookfolioDesignTokens.surface,
      useMaterial3: true,
    );
    final manrope = GoogleFonts.manropeTextTheme(base.textTheme);
    final news = GoogleFonts.newsreaderTextTheme(base.textTheme);
    final textTheme = manrope.copyWith(
      displayLarge: news.displayLarge,
      displayMedium: news.displayMedium,
      displaySmall: news.displaySmall,
      headlineLarge: news.headlineLarge,
      headlineMedium: news.headlineMedium,
      headlineSmall: news.headlineSmall,
    );
    return base.copyWith(
      textTheme: textTheme,
      primaryTextTheme: GoogleFonts.manropeTextTheme(base.primaryTextTheme),
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
        titleTextStyle: GoogleFonts.newsreader(
          fontSize: 22,
          fontStyle: FontStyle.italic,
          fontWeight: FontWeight.w500,
          color: BookfolioDesignTokens.primary,
        ),
      ),
    );
  }

  /// 다크 테마(문서 미정의 — 가독성용 톤다운; 라이트와 동일 타이포 패턴).
  static ThemeData dark() {
    const surface = Color(0xFF1C1B18);
    const onSurface = Color(0xFFE8E4DD);
    final colorScheme = ColorScheme.dark(
      primary: const Color(0xFF9AB9A8),
      onPrimary: const Color(0xFF0D1F14),
      primaryContainer: const Color(0xFF243D30),
      onPrimaryContainer: const Color(0xFFD5E5DA),
      secondary: const Color(0xFFB5AAA0),
      onSecondary: const Color(0xFF2A2520),
      secondaryContainer: const Color(0xFF3D3830),
      onSecondaryContainer: const Color(0xFFEFE0D4),
      tertiary: const Color(0xFFE08B95),
      onTertiary: const Color(0xFF3E0A10),
      surface: surface,
      onSurface: onSurface,
      error: const Color(0xFFF2B8B5),
      onError: const Color(0xFF601410),
    ).copyWith(
      onSurfaceVariant: const Color(0xFFC9BFB4),
      outline: const Color(0xFF8A8278).withValues(alpha: 0.45),
      outlineVariant: const Color(0xFF5C554D),
      surfaceContainerLowest: const Color(0xFF141311),
      surfaceContainerLow: const Color(0xFF23211E),
      surfaceContainerHigh: const Color(0xFF2E2B27),
      surfaceContainerHighest: const Color(0xFF38342F),
    );

    final base = ThemeData(
      colorScheme: colorScheme,
      scaffoldBackgroundColor: surface,
      useMaterial3: true,
    );
    final manrope = GoogleFonts.manropeTextTheme(base.textTheme);
    final news = GoogleFonts.newsreaderTextTheme(base.textTheme);
    final textTheme = manrope.copyWith(
      displayLarge: news.displayLarge,
      displayMedium: news.displayMedium,
      displaySmall: news.displaySmall,
      headlineLarge: news.headlineLarge,
      headlineMedium: news.headlineMedium,
      headlineSmall: news.headlineSmall,
    );
    return base.copyWith(
      textTheme: textTheme,
      primaryTextTheme: GoogleFonts.manropeTextTheme(base.primaryTextTheme),
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: surface,
        foregroundColor: onSurface,
        titleTextStyle: GoogleFonts.newsreader(
          fontSize: 22,
          fontStyle: FontStyle.italic,
          fontWeight: FontWeight.w500,
          color: colorScheme.primary,
        ),
      ),
    );
  }
}
