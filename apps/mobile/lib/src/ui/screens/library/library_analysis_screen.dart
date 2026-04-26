import 'package:flutter/material.dart';
import 'package:seogadam_mobile/src/ui/screens/etc/my_stats_screen.dart';

/// 내 서가 분석 화면 진입점.
///
/// `My_Stat` 시안 기반 UI는 `etc/my_stats_screen.dart`에서 렌더링하며,
/// 기존 진입처 호환을 위해 이 래퍼를 유지한다.
class LibraryAnalysisScreen extends StatelessWidget {
  const LibraryAnalysisScreen({super.key, this.embeddedInShell = false});

  final bool embeddedInShell;

  @override
  Widget build(BuildContext context) =>
      MyStatsScreen(embeddedInShell: embeddedInShell);
}
