import 'package:seogadam_mobile/src/ui/layout/main_shell_tab_scope.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// 발견 하위 화면 상단 브레드크럼 (예: 발견 > 베스트 셀러).
///
/// History:
/// - 2026-05-12: 「발견」 탭 시 쉘 본문 스택 정리 후 발견 탭으로 이동
/// - 2026-05-12: 신규 — 베스트셀러·초이스 신간 상단 내비 맥락 표시
class DiscoveryFlowBreadcrumb extends StatelessWidget {
  const DiscoveryFlowBreadcrumb({super.key, required this.leafLabel});

  final String leafLabel;

  /// 메인 쉘 안이면 본문 [Navigator]만 닫고 발견 탭으로 전환한다.
  static void navigateToDiscoverTab(BuildContext context) {
    final shell = MainShellTabScope.maybeFind(context);
    final nav = Navigator.maybeOf(context, rootNavigator: false);
    if (nav != null && nav.canPop()) {
      nav.popUntil((route) => route.isFirst);
    }
    shell?.goTab(MainShellTabScope.discoverTabIndex);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final muted = scheme.onSurfaceVariant;
    final baseStyle = GoogleFonts.manrope(
      fontSize: 13,
      color: muted,
      height: 1.3,
    );
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        Tooltip(
          message: '발견 탭으로 이동',
          child: InkWell(
            onTap: () => navigateToDiscoverTab(context),
            borderRadius: BorderRadius.circular(6),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              child: Text(
                '발견',
                style: baseStyle.copyWith(
                  fontWeight: FontWeight.w600,
                  color: scheme.primary,
                  decoration: TextDecoration.underline,
                  decorationColor: scheme.primary.withValues(alpha: 0.45),
                ),
              ),
            ),
          ),
        ),
        Text(' > ', style: baseStyle),
        Flexible(
          child: Text(
            leafLabel,
            style: baseStyle.copyWith(
              fontWeight: FontWeight.w800,
              color: scheme.onSurface,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
