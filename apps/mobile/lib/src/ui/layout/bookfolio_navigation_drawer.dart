import 'package:seogadam_mobile/src/ui/screens/discovery/bestseller_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/library/library_analysis_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/choice_new_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/etc/profile_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/legal/legal_markdown_screen.dart';
import 'package:flutter/material.dart';

/// 햄버거 메뉴(내 서가·프로필·내 서가 통계·발견·모임서가·법적 고지).
///
/// History:
/// - 2026-05-12: 햄버거 법적 고지에서 「쿠키 정책」·웹 `/cookies` 열기 제거
/// - 2026-05-12: `openLibraryStatsInShell`·`openBestsellerInShell`·`openChoiceNewInShell` — 드로어에서 쉘 본문 [Navigator] 푸시
/// - 2026-05-12: `openProfileInShell` — 메인 쉘 중첩 [Navigator]에서 프로필 열기(상·하단 유지)
/// - 2026-05-12: `onAfterProfilePop` — 루트 `push` 프로필 복귀 시 콜백(발견 갱신 등)
/// - 2026-05-12: 「통계·서가담 집계」 항목 제거·프로필·통계·발견 푸시 시 `embeddedInShell: true`
/// - 2026-04-26: 「내 통계」 라벨을 「내 서가 통계」로 변경하고 `LibraryAnalysisScreen`으로 연동
/// - 2026-04-26: 드로어 헤더 로고를 `Seogadam_Web_logo.png` 단일 이미지로 교체
/// - 2026-04-07: 법적 고지 상단 `Divider` 제거·「통계·서가담 집계」라벨·스낵바 카피
/// - 2026-04-05: 드로어 헤더 브랜드명 서가담·`LibraryAnalysisScreen` 통합
/// - 2026-04-02: 드로어 헤더에 로고·브랜드명·짧은 소개 문구
/// - 2026-04-02: `LibraryScreen`에서 분리 — 메인 쉘과 동일 드로어 공유
class BookfolioNavigationDrawer extends StatelessWidget {
  const BookfolioNavigationDrawer({
    super.key,
    this.onTapMyLibrary,
    this.onTapSharedLibrary,
    this.openProfileInShell,
    this.openLibraryStatsInShell,
    this.openBestsellerInShell,
    this.openChoiceNewInShell,
    this.onAfterProfilePop,
  });

  /// 「내 서가」 — 하단 탭 0·내 서가 모드.
  final VoidCallback? onTapMyLibrary;

  /// 「모임서가」 — 하단 탭 0·공동 서가 모드.
  final VoidCallback? onTapSharedLibrary;

  /// [MainShellScreen] 등에서 주입 — 쉘 `body` [Navigator]에 프로필을 쌓아 상·하단 탭을 유지한다.
  final Future<void> Function()? openProfileInShell;

  /// 쉘 본문 [Navigator]에 [LibraryAnalysisScreen] 푸시.
  final Future<void> Function()? openLibraryStatsInShell;

  /// 쉘 본문 [Navigator]에 [BestsellerScreen] 푸시.
  final Future<void> Function()? openBestsellerInShell;

  /// 쉘 본문 [Navigator]에 [ChoiceNewScreen] 푸시.
  final Future<void> Function()? openChoiceNewInShell;

  /// `openProfileInShell`이 없을 때, 루트 `push` 프로필이 닫힌 뒤 호출.
  final VoidCallback? onAfterProfilePop;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final onSurfaceVar = colorScheme.onSurfaceVariant;

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              color: colorScheme.primaryContainer.withValues(alpha: 0.4),
            ),
            child: Align(
              alignment: Alignment.bottomLeft,
              child: Image.asset(
                'assets/brand/600_Login_Back.png',
                width: 240,
                fit: BoxFit.contain,
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.collections_bookmark_outlined),
            title: const Text('내 서가'),
            onTap: () {
              Navigator.pop(context);
              onTapMyLibrary?.call();
            },
          ),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('프로필'),
            onTap: () async {
              Navigator.pop(context);
              if (openProfileInShell != null) {
                await openProfileInShell!();
              } else {
                await Navigator.of(context).push<void>(
                  MaterialPageRoute(
                      builder: (_) =>
                          const ProfileScreen(embeddedInShell: false)),
                );
                onAfterProfilePop?.call();
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.bar_chart_outlined),
            title: const Text('내 서가 통계'),
            onTap: () async {
              Navigator.pop(context);
              if (openLibraryStatsInShell != null) {
                await openLibraryStatsInShell!();
              } else {
                await Navigator.of(context).push<void>(
                  MaterialPageRoute(
                    builder: (_) => const LibraryAnalysisScreen(
                      embeddedInShell: false,
                    ),
                  ),
                );
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.local_fire_department_outlined),
            title: const Text('베스트셀러'),
            onTap: () async {
              Navigator.pop(context);
              if (openBestsellerInShell != null) {
                await openBestsellerInShell!();
              } else {
                await Navigator.of(context).push<void>(
                  MaterialPageRoute(
                    builder: (_) =>
                        const BestsellerScreen(embeddedInShell: false),
                  ),
                );
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.new_releases_outlined),
            title: const Text('초이스 신간'),
            onTap: () async {
              Navigator.pop(context);
              if (openChoiceNewInShell != null) {
                await openChoiceNewInShell!();
              } else {
                await Navigator.of(context).push<void>(
                  MaterialPageRoute(
                    builder: (_) =>
                        const ChoiceNewScreen(embeddedInShell: false),
                  ),
                );
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.groups_2_outlined),
            title: const Text('모임서가'),
            onTap: () {
              Navigator.pop(context);
              onTapSharedLibrary?.call();
            },
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                '법적 고지',
                style: textTheme.labelSmall?.copyWith(
                  color: onSurfaceVar,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.2,
                ),
              ),
            ),
          ),
          ListTile(
            dense: true,
            visualDensity: VisualDensity.compact,
            leading:
                Icon(Icons.privacy_tip_outlined, size: 20, color: onSurfaceVar),
            title: Text(
              '개인정보처리방침',
              style: textTheme.bodySmall?.copyWith(fontSize: 13),
            ),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context)
                  .push<void>(LegalMarkdownScreen.privacyRoute());
            },
          ),
          ListTile(
            dense: true,
            visualDensity: VisualDensity.compact,
            leading:
                Icon(Icons.article_outlined, size: 20, color: onSurfaceVar),
            title: Text(
              '서비스 약관',
              style: textTheme.bodySmall?.copyWith(fontSize: 13),
            ),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context)
                  .push<void>(LegalMarkdownScreen.termsRoute());
            },
          ),
        ],
      ),
    );
  }
}
