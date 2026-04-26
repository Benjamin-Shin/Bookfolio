import 'package:seogadam_mobile/src/ui/screens/discovery/bestseller_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/library/library_analysis_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/choice_new_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/shared_library/shared_libraries_screen.dart';
import 'package:flutter/material.dart';

/// 5개 허브 화면 간 이동용 탭 식별자.
enum MainHubTab { shared, aggregate, bestseller, choice, library }

/// 루트(내 서가)까지 돌아간 뒤 선택한 허브로 이동합니다.
///
/// History:
/// - 2026-04-05: `MainHubTab.aggregate` → `LibraryAnalysisScreen`(집계 포함)
/// - 2026-04-07: 「서가담 집계」라벨
/// - 2026-03-28: 순서 — 공동서가·집계·베스트셀러·초이스 신간·내 서가; `aggregate` 추가
/// - 2026-03-26: 허브 탭에 Material 아이콘(서가·통계·공동·불꽃·신규)
/// - 2026-03-26: 「초이스신간」 표기 → 「초이스 신간」
/// - 2026-03-26: 신규 — 내서가·통계·모임서가·베스트셀러·초이스 상단 바
void openMainHubTab(BuildContext context, MainHubTab tab) {
  final nav = Navigator.of(context);
  nav.popUntil((route) => route.isFirst);
  switch (tab) {
    case MainHubTab.library:
      break;
    case MainHubTab.shared:
      nav.push(MaterialPageRoute<void>(
          builder: (_) => const SharedLibrariesScreen()));
      break;
    case MainHubTab.aggregate:
      nav.push(MaterialPageRoute<void>(
          builder: (_) => const LibraryAnalysisScreen()));
      break;
    case MainHubTab.bestseller:
      nav.push(
          MaterialPageRoute<void>(builder: (_) => const BestsellerScreen()));
      break;
    case MainHubTab.choice:
      nav.push(
          MaterialPageRoute<void>(builder: (_) => const ChoiceNewScreen()));
      break;
  }
}

/// 허브 화면 상단 가로 메뉴.
///
/// History:
/// - 2026-03-29: 다크 모드 대응 (`ColorScheme` 기반)
class MainHubTopNavBar extends StatelessWidget {
  const MainHubTopNavBar({super.key, required this.current});

  final MainHubTab current;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    Widget link(String label, MainHubTab tab, IconData icon) {
      final selected = tab == current;
      final fg = selected ? scheme.primary : scheme.onSurfaceVariant;
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
      color: scheme.surfaceContainerHigh,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        child: Row(
          children: [
            link('모임서가', MainHubTab.shared, Icons.groups_2_outlined),
            link('서가담 집계', MainHubTab.aggregate, Icons.leaderboard_outlined),
            link('베스트셀러', MainHubTab.bestseller,
                Icons.local_fire_department_outlined),
            link('초이스 신간', MainHubTab.choice, Icons.new_releases_outlined),
            link('내 서가', MainHubTab.library,
                Icons.collections_bookmark_outlined),
          ],
        ),
      ),
    );
  }
}
