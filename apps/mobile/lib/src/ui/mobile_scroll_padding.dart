import 'package:flutter/material.dart';

/// [LibraryScreen] 그리드 `SliverPadding` 하단과 동일 — FAB가 떠 있는 높이만큼 스크롤 콘텐츠를 올림.
const double kBookfolioFabClearancePadding = 108;

/// 모바일 하단 제스처/내비게이션 바 + FAB 영역을 피하는 리스트·싱글차일드 스크롤 하단 패딩.
EdgeInsets bookfolioMobileScrollPadding(BuildContext context) {
  final safeBottom = MediaQuery.viewPaddingOf(context).bottom;
  return EdgeInsets.fromLTRB(16, 16, 16, 16 + safeBottom + kBookfolioFabClearancePadding);
}
