import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/screens/book_form_screen.dart';
import 'package:seogadam_mobile/src/ui/widgets/library_browse_tab.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 내 서재: 종이책 목록(검색·필터·그리드) + 도서 추가.
///
/// History:
/// - 2026-04-12: 「요약」탭 제거 — 이벤트 캘린더는 홈(`ReadingEventsCalendarCard`)으로 이동
/// - 2026-04-12: 상단 `도서 추가` — `BookFormScreen` 진입·복귀 시 목록 갱신
/// - 2026-04-07: 통계 블록에서 `Divider` 제거 — 톤 배경·간격만(DESIGN no-line)
/// - 2026-04-05: 「요약 | 내 책」세그먼트 — 검색·그리드는 내 책(발견 탭과 분리)
/// - 2026-04-02: 「내 서재 분석」아래 목록·검색·필터는 검색 탭으로 이동
/// - 2026-04-03: 앱바와 중복되던 헤더 블록(내 서재·종이책) 제거
/// - 2026-04-05: 하단 내비 여백 `kBookfolioShellBottomNavClearance` 반영
/// - 2026-04-02: 허브 UI·종이책만·캘린더 표지·집계 API 연동; 쉘에 임베드(앱바/드로어 없음)
/// - 2026-04-01: 상단 허브 바 제거(드로어로 이동), 가격·검색은 다이얼로그, 한 줄 액션바+책 추가, 하단 페이지네이션 여백 축소
/// - 2026-03-29: 드로어 하단 법적 고지 — 웹 `/privacy`·`/terms`·`/cookies` 외부 브라우저
/// - 2026-03-29: 페이지 바를 스크롤 밖 하단 고정·`canGoToNext` 휴리스틱(항상 조작 가능)
/// - 2026-03-29: 소장 책 가격 합계 배너(웹 대시보드 동일 API)
/// - 2026-03-29: API 페이지네이션·검색·읽기상태 필터·테마 연동
/// - 2026-03-26: 상단 `MainHubTopNavBar` 추가
class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  Future<void> _openAddBook() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(builder: (_) => const BookFormScreen()),
    );
    if (!mounted) return;
    await context.read<LibraryController>().loadBooks();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SizedBox.expand(
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color.lerp(colorScheme.surface, colorScheme.primaryContainer, 0.12)!,
              colorScheme.surfaceContainerLow,
            ],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
              child: Row(
                children: [
                  const Spacer(),
                  FilledButton.tonalIcon(
                    onPressed: _openAddBook,
                    icon: const Icon(Icons.add_rounded, size: 20),
                    label: const Text('도서 추가'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                      visualDensity: VisualDensity.compact,
                    ),
                  ),
                ],
              ),
            ),
            const Expanded(child: LibraryBrowseTab()),
          ],
        ),
      ),
    );
  }
}
