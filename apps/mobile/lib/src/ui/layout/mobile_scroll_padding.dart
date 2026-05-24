import 'package:flutter/material.dart';

/// 모바일 스크롤 하단 안전 영역·FAB·쉘 내비 여백.
///
/// History:
/// - 2026-05-24: `bookfolioShellPushedDetailScrollPadding` — 쉘 푸시 단일 상세(발견 도서 상세 등)
/// - 2026-05-23: `bookfolioLegalMarkdownPadding` — 약관·개인정보 마크다운 하단(쉘 탭·제스처 영역)
/// - 2026-05-21: `bookfolioShellBottomNavInset`·`bookfolioShellPushedListScrollPadding` — 쉘 푸시 목록 하단 가림 보정
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

/// [MainShellScreen] `extendBody` 하단 5탭이 겹치는 높이(시스템 제스처 포함).
double bookfolioShellBottomNavInset(BuildContext context) {
  return MediaQuery.viewPaddingOf(context).bottom +
      kBookfolioShellBottomNavClearance;
}

/// 쉘 본문 [Navigator]에 푸시된 목록 — 뷰포트를 내비 위로 두고 스크롤 여백만 소량 둠.
EdgeInsets bookfolioShellPushedListScrollPadding() {
  return const EdgeInsets.fromLTRB(16, 4, 16, 16);
}

/// 쉘 본문 [Navigator]에 푸시된 단일 상세(Scaffold+AppBar) — 하단 5탭·제스처 회피.
EdgeInsets bookfolioShellPushedDetailScrollPadding(
  BuildContext context, {
  double left = 16,
  double top = 12,
  double right = 16,
}) {
  return EdgeInsets.fromLTRB(
    left,
    top,
    right,
    16 + bookfolioShellBottomNavInset(context) + 32,
  );
}

/// [LegalMarkdownScreen] 마크다운 스크롤 하단 — FAB 없음, 쉘 푸시 시 하단 5탭 회피.
EdgeInsets bookfolioLegalMarkdownPadding(
  BuildContext context, {
  bool embeddedInShell = false,
}) {
  final safeBottom = MediaQuery.viewPaddingOf(context).bottom;
  final bottom = embeddedInShell
      ? 16 + bookfolioShellBottomNavInset(context) + 32
      : 16 + safeBottom + 32;
  return EdgeInsets.fromLTRB(20, 16, 20, bottom);
}
