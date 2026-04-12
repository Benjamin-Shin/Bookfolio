import 'package:seogadam_mobile/src/ui/screens/bestseller_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/library_analysis_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/choice_new_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/my_stats_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/profile_screen.dart';
import 'package:seogadam_mobile/src/util/bookfolio_web_urls.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:url_launcher/url_launcher.dart';

/// 햄버거 메뉴(내 서재·프로필·통계·집계·공동서재·법적 고지).
///
/// History:
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

  /// 「내 서재」 — 하단 탭 0·내 서재 모드.
  final VoidCallback? onTapMyLibrary;

  /// 「공동서재」 — 하단 탭 0·공동 서재 모드.
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
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SvgPicture.asset(
                        'assets/brand/bookfolio_logo.svg',
                        width: 34,
                        height: 34,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '서가담',
                          style: textTheme.titleLarge?.copyWith(
                            color: colorScheme.onPrimaryContainer,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '나만의 서재와 독서 기록을 한곳에서.',
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onPrimaryContainer.withValues(alpha: 0.9),
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.collections_bookmark_outlined),
            title: const Text('내 서재'),
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
            title: const Text('내 통계'),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).push<void>(
                MaterialPageRoute(builder: (_) => const MyStatsScreen()),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.leaderboard_outlined),
            title: const Text('통계·서가담 집계'),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).push<void>(
                MaterialPageRoute(builder: (_) => const LibraryAnalysisScreen()),
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
            title: const Text('공동서재'),
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
            leading: Icon(Icons.privacy_tip_outlined, size: 20, color: onSurfaceVar),
            title: Text(
              '개인정보처리방침',
              style: textTheme.bodySmall?.copyWith(fontSize: 13),
            ),
            onTap: () {
              Navigator.pop(context);
              _openBookfolioWebPath(context, '/privacy');
            },
          ),
          ListTile(
            dense: true,
            visualDensity: VisualDensity.compact,
            leading: Icon(Icons.article_outlined, size: 20, color: onSurfaceVar),
            title: Text(
              '서비스 약관',
              style: textTheme.bodySmall?.copyWith(fontSize: 13),
            ),
            onTap: () {
              Navigator.pop(context);
              _openBookfolioWebPath(context, '/terms');
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
