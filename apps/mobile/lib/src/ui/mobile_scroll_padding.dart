import 'package:flutter/material.dart';

/// 모바일 스크롤 하단 안전 영역·FAB·쉘 내비 여백.
///
/// History:
/// - 2026-04-05: `kBookfolioShellBottomNavClearance`·`bookfolioShellTabScrollPadding` (메인 쉘 FAB 제거)
/// [LibraryScreen] 그리드 `SliverPadding` 하단과 동일 — FAB가 떠 있는 높이만큼 스크롤 콘텐츠를 올림.
const double kBookfolioFabClearancePadding = 108;

/// 메인 쉘 하단 5탭 바(라벨 포함) + 여백 — FAB 없음.
const double kBookfolioShellBottomNavClearance = 92;

/// 모바일 하단 제스처/내비게이션 바 + FAB 영역을 피하는 리스트·싱글차일드 스크롤 하단 패딩.
EdgeInsets bookfolioMobileScrollPadding(BuildContext context) {
  final safeBottom = MediaQuery.viewPaddingOf(context).bottom;
  return EdgeInsets.fromLTRB(16, 16, 16, 16 + safeBottom + kBookfolioFabClearancePadding);
}

/// [MainShellScreen] 탭 본문 — 하단 내비만 피함(FAB 제거).
EdgeInsets bookfolioShellTabScrollPadding(BuildContext context) {
  final safeBottom = MediaQuery.viewPaddingOf(context).bottom;
  return EdgeInsets.fromLTRB(16, 16, 16, 16 + safeBottom + kBookfolioShellBottomNavClearance);
}
