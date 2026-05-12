import 'package:flutter/material.dart';

/// [MainShellScreen]이 하단 탭 전환을 자손에게 넘길 때 쓰는 [InheritedWidget].
///
/// History:
/// - 2026-05-12: 신규 — 발견 하위 브레드크럼에서 발견 탭으로 복귀
class MainShellTabScope extends InheritedWidget {
  const MainShellTabScope({
    super.key,
    required this.goTab,
    required super.child,
  });

  /// 메인 쉘 [BottomNavigationBar]와 동일한 인덱스.
  static const int discoverTabIndex = 3;

  final void Function(int tabIndex) goTab;

  static MainShellTabScope? maybeFind(BuildContext context) {
    return context.findAncestorWidgetOfExactType<MainShellTabScope>();
  }

  @override
  bool updateShouldNotify(MainShellTabScope oldWidget) => goTab != oldWidget.goTab;
}
