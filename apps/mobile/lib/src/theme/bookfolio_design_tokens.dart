import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// 모바일 에디토리얼 토큰 — `#Reference/DESIGN.md`(서가담 Seogadam) 단일 소스.
/// 사용자 노출 브랜드는 **서가담**, 패키지·클래스 접두어 `bookfolio_*`는 유지.
///
/// History:
/// - 2026-04-12: `#Reference/DESIGN.md` 팔레트·Manrope·서피스 계층으로 단일화
/// - 2026-04-07: Stitch1·DESIGN 감사 — 문서 상호 참조·섹션 간격 상수
/// - 2026-04-05: 모바일 공통 색·타이포·반경·고스트 보더·앰비언트 섀도
abstract final class BookfolioDesignTokens {
  // —— Color & surface (`DESIGN.md` §2) ——
  static const Color surface = Color(0xFFFCF7F4);
  static const Color surfaceContainerLow = Color(0xFFF6F3ED);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  /// 입력·블록 대비용(문서 `surface-container-high` 톤).
  static const Color surfaceContainerHigh = Color(0xFFEBE8E0);
  static const Color surfaceContainerHighest = Color(0xFFE3DED4);

  static const Color primary = Color(0xFF084226);
  static const Color primaryContainer = Color(0xFF06311C);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color onPrimaryContainer = Color(0xFFD5E5DA);

  static const Color onSurface = Color(0xFF1C1917);
  /// 메타데이터·보조 텍스트 (`DESIGN.md` secondary).
  static const Color onSurfaceVariant = Color(0xFF675D53);
  static const Color secondary = Color(0xFF675D53);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color secondaryContainer = Color(0xFFEFE0D4);
  static const Color onSecondaryContainer = Color(0xFF3D3830);

  static const Color outlineVariant = Color(0xFFC9BFB4);

  /// Archivist's Ribbon 등 시그니처 악센트(버건디).
  static const Color tertiary = Color(0xFF722F37);
  static const Color onTertiary = Color(0xFFFFFFFF);

  /// 입력 포커스 — 프라이머리 톤(금색 제거, 단일 소스 정렬).
  static const Color inputFocus = primary;

  // —— Radii (no pill shapes) ——
  static const double radiusSm = 2;
  static const double radiusMd = 6;

  static const double sectionGapMd = 28;
  static const double sectionGapSm = 20;

  /// Glass bar: 문서 `surface` 80% + ~20px 블러(화면에서 sigma로 근사).
  static const double glassSurfaceOpacity = 0.8;
  static const double glassBlurSigma = 20;

  // —— Borders: Ghost Border (`DESIGN.md` §4) ——
  static Color ghostOutline([double opacity = 0.15]) =>
      outlineVariant.withValues(alpha: opacity);

  static BorderSide ghostBorderSide({double opacity = 0.15, double width = 1}) =>
      BorderSide(color: ghostOutline(opacity), width: width);

  /// 표지용 초얇은 고스트(§5 · 0.5px 권장).
  static BorderSide coverGhostBorderSide({double opacity = 0.1}) =>
      BorderSide(color: ghostOutline(opacity), width: 0.5);

  // —— Ambient shadow (on-surface + primary hint, ~4% §4) ——
  static List<BoxShadow> ambientShadowPrimary() => [
        BoxShadow(
          color: Color.alphaBlend(
            primary.withValues(alpha: 0.08),
            onSurface.withValues(alpha: 0.04),
          ),
          blurRadius: 28,
          offset: const Offset(0, 10),
        ),
      ];

  static const LinearGradient inkGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [primary, primaryContainer],
  );

  // —— Typography: Newsreader + Manrope (`DESIGN.md` §3) ——
  static TextStyle displayLg(Color color) => GoogleFonts.newsreader(
        fontSize: 56,
        height: 1.05,
        fontStyle: FontStyle.italic,
        fontWeight: FontWeight.w400,
        color: color,
        letterSpacing: -0.5,
      );

  static TextStyle headlineMd(Color color, {FontStyle fontStyle = FontStyle.italic}) =>
      GoogleFonts.newsreader(
        fontSize: 28,
        height: 1.2,
        fontStyle: fontStyle,
        fontWeight: FontWeight.w400,
        color: color,
      );

  static TextStyle titleMd(Color color, {FontWeight fontWeight = FontWeight.w600}) {
    const fs = 18.0;
    return GoogleFonts.manrope(
      fontSize: fs,
      height: 1.35,
      fontWeight: fontWeight,
      letterSpacing: 0.05 * fs,
      color: color,
    );
  }

  static TextStyle bodyLg(Color color, {FontWeight fontWeight = FontWeight.w400}) =>
      GoogleFonts.manrope(
        fontSize: 16,
        height: 1.4,
        fontWeight: fontWeight,
        color: color,
      );

  static TextStyle labelMd(Color color, {double opacity = 1, FontWeight fontWeight = FontWeight.w600}) =>
      GoogleFonts.manrope(
        fontSize: 12,
        height: 1.25,
        fontWeight: fontWeight,
        letterSpacing: 1.2,
        color: color.withValues(alpha: opacity),
      );
}
