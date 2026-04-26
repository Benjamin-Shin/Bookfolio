import 'package:seogadam_mobile/src/ui/screens/discovery/bestseller_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/library/library_analysis_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/choice_new_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/etc/profile_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/legal/legal_markdown_screen.dart';
import 'package:seogadam_mobile/src/util/bookfolio_web_urls.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// 햄버거 메뉴(내 서가·프로필·통계·집계·공동서가·법적 고지).
///
/// History:
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
  });

  /// 「내 서가」 — 하단 탭 0·내 서가 모드.
  final VoidCallback? onTapMyLibrary;

  /// 「모임서가」 — 하단 탭 0·공동 서가 모드.
  final VoidCallback? onTapSharedLibrary;

  Future<void> _openBookfolioWebPath(BuildContext context, String path) async {
    final uri = bookfolioWebPageUri(path);
    if (!uri.hasScheme || uri.host.isEmpty) {
      if (context.mounted) {
        ScaffoldMessenger.maybeOf(context)?.showSnackBar(
          const SnackBar(content: Text('서가담 API 주소가 설정되지 않았습니다.')),
        );
      }
      return;
    }
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && context.mounted) {
      ScaffoldMessenger.maybeOf(context)?.showSnackBar(
        const SnackBar(content: Text('브라우저를 열 수 없습니다.')),
      );
    }
  }

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
                'assets/brand/Seogadam_Web_logo.png',
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
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).push<void>(
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.bar_chart_outlined),
            title: const Text('내 서가 통계'),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).push<void>(
                MaterialPageRoute(builder: (_) => const LibraryAnalysisScreen()),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.leaderboard_outlined),
            title: const Text('통계·서가담 집계'),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).push<void>(
                MaterialPageRoute(
                    builder: (_) => const LibraryAnalysisScreen()),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.local_fire_department_outlined),
            title: const Text('베스트셀러'),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).push<void>(
                MaterialPageRoute(builder: (_) => const BestsellerScreen()),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.new_releases_outlined),
            title: const Text('초이스 신간'),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).push<void>(
                MaterialPageRoute(builder: (_) => const ChoiceNewScreen()),
              );
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
              Navigator.of(context).push<void>(LegalMarkdownScreen.termsRoute());
            },
          ),
          ListTile(
            dense: true,
            visualDensity: VisualDensity.compact,
            leading: Icon(Icons.cookie_outlined, size: 20, color: onSurfaceVar),
            title: Text(
              '쿠키 정책',
              style: textTheme.bodySmall?.copyWith(fontSize: 13),
            ),
            onTap: () {
              Navigator.pop(context);
              _openBookfolioWebPath(context, '/cookies');
            },
          ),
        ],
      ),
    );
  }
}
