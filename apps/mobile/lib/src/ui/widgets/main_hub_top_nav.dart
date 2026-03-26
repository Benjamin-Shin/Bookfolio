import 'package:bookfolio_mobile/src/ui/screens/bestseller_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/choice_new_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/my_stats_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/shared_libraries_screen.dart';
import 'package:flutter/material.dart';

/// 5개 허브 화면 간 이동용 탭 식별자.
enum MainHubTab { library, stats, shared, bestseller, choice }

/// 루트(내 서재)까지 돌아간 뒤 선택한 허브로 이동합니다.
///
/// History:
/// - 2026-03-26: 허브 탭에 Material 아이콘(서재·통계·공동·불꽃·신규)
/// - 2026-03-26: 「초이스신간」 표기 → 「초이스 시간」
/// - 2026-03-26: 신규 — 내서재·통계·공동서재·베스트셀러·초이스 상단 바
void openMainHubTab(BuildContext context, MainHubTab tab) {
  final nav = Navigator.of(context);
  nav.popUntil((route) => route.isFirst);
  switch (tab) {
    case MainHubTab.library:
      break;
    case MainHubTab.stats:
      nav.push(MaterialPageRoute<void>(builder: (_) => const MyStatsScreen()));
      break;
    case MainHubTab.shared:
      nav.push(MaterialPageRoute<void>(builder: (_) => const SharedLibrariesScreen()));
      break;
    case MainHubTab.bestseller:
      nav.push(MaterialPageRoute<void>(builder: (_) => const BestsellerScreen()));
      break;
    case MainHubTab.choice:
      nav.push(MaterialPageRoute<void>(builder: (_) => const ChoiceNewScreen()));
      break;
  }
}

/// 허브 화면 상단 가로 메뉴.
class MainHubTopNavBar extends StatelessWidget {
  const MainHubTopNavBar({super.key, required this.current});

  final MainHubTab current;

  @override
  Widget build(BuildContext context) {
    Widget link(String label, MainHubTab tab, IconData icon) {
      final selected = tab == current;
      final fg = selected ? const Color(0xFFB3582F) : const Color(0xFF5C4A3A);
      return Padding(
        padding: const EdgeInsets.only(right: 2),
        child: TextButton(
          onPressed: selected ? null : () => openMainHubTab(context, tab),
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            foregroundColor: fg,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 15, color: fg),
              const SizedBox(width: 3),
              Text(
                label,
                style: TextStyle(
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                  fontSize: 12.5,
                  height: 1.2,
                  color: fg,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Material(
      elevation: 0,
      color: const Color(0xFFE5DCD0),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        child: Row(
          children: [
            link('내서재', MainHubTab.library, Icons.collections_bookmark_outlined),
            link('내 통계', MainHubTab.stats, Icons.bar_chart_outlined),
            link('공동서재', MainHubTab.shared, Icons.groups_2_outlined),
            link('베스트셀러', MainHubTab.bestseller, Icons.local_fire_department_outlined),
            link('초이스 시간', MainHubTab.choice, Icons.new_releases_outlined),
          ],
        ),
      ),
    );
  }
}
