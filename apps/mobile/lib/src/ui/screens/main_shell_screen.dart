import 'dart:ui' show ImageFilter;

import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/screens/bookfolio_home_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/library_analysis_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/library_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/profile_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/shared_libraries_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discover_screen.dart';
import 'package:seogadam_mobile/src/ui/widgets/bookfolio_navigation_drawer.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

enum _ShelfMode { my, shared }

/// 하단 5탭(홈·서가·발견·통계·프로필) + 상단 블러 앱바·드로어.
///
/// @history
/// - 2026-04-23: 상단 브레드크럼 내비게이션 추가 — 주요 페이지를 한 번에 이동
///
/// History:
/// - 2026-04-12: 앱바·하단 내비 글래스 — `DESIGN.md` surface 80%·20px 블러, 구분선 제거
/// - 2026-04-07: 하단 내비 아이콘 22px — 얇은 라인 톤(Stitch1)
/// - 2026-04-05: 「탐색」→「발견」 — `DiscoverScreen`(베스트·신간·커뮤니티)
/// - 2026-04-05: 앱바 브랜드 카피를 서가담으로 표기
/// - 2026-04-05: 홈 탭을 `BookfolioHomeScreen`으로 교체 — 구 집계는 「통계」탭 하단
/// - 2026-04-05: HTML 목업 정렬 — 탭 순서·라벨·블러 바·앱바 아바타, FAB 제거
/// - 2026-04-02: 하단 내비 위 우측 — `FloatingActionButton`을 햄버거(드로어)로 사용·`ScaffoldState` 키로 열기
/// - 2026-04-03: 앱바 햄버거 제거, 「메뉴」를 집계 우측 하단에 배치·`labelBehavior` 아이콘만
/// - 2026-04-03: 하단 탭에 「프로필」 추가(검색 다음)
/// - 2026-04-02: 신규
class MainShellScreen extends StatefulWidget {
  const MainShellScreen({super.key});

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  int _tabIndex = 0;
  _ShelfMode _shelfMode = _ShelfMode.my;
  String? _toolbarAvatarUrl;
  int _homeRefreshSignal = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadToolbarAvatar());
  }

  Future<void> _loadToolbarAvatar() async {
    if (!mounted) return;
    final auth = context.read<AuthController>();
    if (!auth.isAuthenticated) {
      if (mounted) setState(() => _toolbarAvatarUrl = null);
      return;
    }
    try {
      final api = context.read<LibraryController>().api;
      final p = await api.fetchMeProfile();
      if (mounted) setState(() => _toolbarAvatarUrl = p.avatarUrl);
    } catch (_) {
      if (mounted) setState(() => _toolbarAvatarUrl = null);
    }
  }

  void _openDrawer() {
    _scaffoldKey.currentState?.openDrawer();
  }

  void _goMyShelf() {
    setState(() {
      _shelfMode = _ShelfMode.my;
      _tabIndex = 1;
    });
  }

  void _goSharedShelf() {
    setState(() {
      _shelfMode = _ShelfMode.shared;
      _tabIndex = 1;
    });
  }

  void _goTab(int tabIndex) {
    final was = _tabIndex;
    setState(() {
      _tabIndex = tabIndex;
      if (tabIndex == 0 && was != 0) _homeRefreshSignal++;
      if (tabIndex == 1) _shelfMode = _ShelfMode.my;
    });
    if (tabIndex == 4) _loadToolbarAvatar();
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;

    return Scaffold(
      key: _scaffoldKey,
      extendBody: true,
      drawer: BookfolioNavigationDrawer(
        onTapMyLibrary: _goMyShelf,
        onTapSharedLibrary: _goSharedShelf,
      ),
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(topInset + 96),
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(
              sigmaX: BookfolioDesignTokens.glassBlurSigma,
              sigmaY: BookfolioDesignTokens.glassBlurSigma,
            ),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: BookfolioDesignTokens.surface.withValues(
                    alpha: BookfolioDesignTokens.glassSurfaceOpacity),
              ),
              child: SafeArea(
                bottom: false,
                child: Column(
                  children: [
                    SizedBox(
                      height: 56,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Row(
                          children: [
                            IconButton(
                              onPressed: _openDrawer,
                              icon: Icon(Icons.menu_rounded,
                                  color: BookfolioDesignTokens.primary),
                              tooltip: '메뉴',
                            ),
                            Expanded(
                              child: Text(
                                '서가담',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.newsreader(
                                  fontSize: 22,
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.w500,
                                  color: BookfolioDesignTokens.primary,
                                  height: 1.1,
                                ),
                              ),
                            ),
                            ProfileToolbarAvatar(
                                imageUrl: _toolbarAvatarUrl, size: 40),
                          ],
                        ),
                      ),
                    ),
                    Expanded(
                      child: _ShellBreadcrumbBar(
                        tabIndex: _tabIndex,
                        shelfMode: _shelfMode,
                        onTapHome: () => _goTab(0),
                        onTapMyShelf: _goMyShelf,
                        onTapSharedShelf: _goSharedShelf,
                        onTapDiscover: () => _goTab(2),
                        onTapStats: () => _goTab(3),
                        onTapProfile: () => _goTab(4),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
      body: IndexedStack(
        index: _tabIndex,
        children: [
          BookfolioHomeScreen(
            refreshSignal: _homeRefreshSignal,
            onOpenSharedLibraries: _goSharedShelf,
            onOpenMyLibrary: _goMyShelf,
            onOpenStats: () => setState(() => _tabIndex = 3),
          ),
          _shelfMode == _ShelfMode.my
              ? const LibraryScreen()
              : const SharedLibrariesScreen(embeddedInShell: true),
          const DiscoverScreen(embeddedInShell: true),
          const LibraryAnalysisScreen(embeddedInShell: true),
          const ProfileScreen(embeddedInShell: true),
        ],
      ),
      bottomNavigationBar: _BookfolioBottomNavBar(
        currentIndex: _tabIndex,
        onChanged: _goTab,
      ),
    );
  }
}

class _ShellBreadcrumbBar extends StatelessWidget {
  const _ShellBreadcrumbBar({
    required this.tabIndex,
    required this.shelfMode,
    required this.onTapHome,
    required this.onTapMyShelf,
    required this.onTapSharedShelf,
    required this.onTapDiscover,
    required this.onTapStats,
    required this.onTapProfile,
  });

  final int tabIndex;
  final _ShelfMode shelfMode;
  final VoidCallback onTapHome;
  final VoidCallback onTapMyShelf;
  final VoidCallback onTapSharedShelf;
  final VoidCallback onTapDiscover;
  final VoidCallback onTapStats;
  final VoidCallback onTapProfile;

  @override
  Widget build(BuildContext context) {
    final bool shelfSelected = tabIndex == 1;
    final bool sharedSelected = shelfSelected && shelfMode == _ShelfMode.shared;
    final Color activeColor = BookfolioDesignTokens.primary;
    final Color inactiveColor = Theme.of(context).colorScheme.onSurfaceVariant;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _BreadcrumbItem(
              label: '홈',
              selected: tabIndex == 0,
              onTap: onTapHome,
              activeColor: activeColor,
              inactiveColor: inactiveColor,
            ),
            _BreadcrumbChevron(color: inactiveColor),
            _BreadcrumbItem(
              label: '서가',
              selected: shelfSelected && shelfMode == _ShelfMode.my,
              onTap: onTapMyShelf,
              activeColor: activeColor,
              inactiveColor: inactiveColor,
            ),
            _BreadcrumbChevron(color: inactiveColor),
            _BreadcrumbItem(
              label: '공유서가',
              selected: sharedSelected,
              onTap: onTapSharedShelf,
              activeColor: activeColor,
              inactiveColor: inactiveColor,
            ),
            _BreadcrumbChevron(color: inactiveColor),
            _BreadcrumbItem(
              label: '발견',
              selected: tabIndex == 2,
              onTap: onTapDiscover,
              activeColor: activeColor,
              inactiveColor: inactiveColor,
            ),
            _BreadcrumbChevron(color: inactiveColor),
            _BreadcrumbItem(
              label: '통계',
              selected: tabIndex == 3,
              onTap: onTapStats,
              activeColor: activeColor,
              inactiveColor: inactiveColor,
            ),
            _BreadcrumbChevron(color: inactiveColor),
            _BreadcrumbItem(
              label: '프로필',
              selected: tabIndex == 4,
              onTap: onTapProfile,
              activeColor: activeColor,
              inactiveColor: inactiveColor,
            ),
          ],
        ),
      ),
    );
  }
}

class _BreadcrumbChevron extends StatelessWidget {
  const _BreadcrumbChevron({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Icon(
        Icons.chevron_right_rounded,
        size: 16,
        color: color.withValues(alpha: 0.72),
      ),
    );
  }
}

class _BreadcrumbItem extends StatelessWidget {
  const _BreadcrumbItem({
    required this.label,
    required this.selected,
    required this.onTap,
    required this.activeColor,
    required this.inactiveColor,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color activeColor;
  final Color inactiveColor;

  @override
  Widget build(BuildContext context) {
    final Color color =
        selected ? activeColor : inactiveColor.withValues(alpha: 0.88);
    return TextButton(
      onPressed: onTap,
      style: TextButton.styleFrom(
        foregroundColor: color,
        minimumSize: const Size(0, 28),
        padding: const EdgeInsets.symmetric(horizontal: 8),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Text(
        label,
        style: GoogleFonts.manrope(
          fontSize: 13,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          letterSpacing: 0.1,
        ),
      ),
    );
  }
}

class _BookfolioBottomNavBar extends StatelessWidget {
  const _BookfolioBottomNavBar({
    required this.currentIndex,
    required this.onChanged,
  });

  final int currentIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final inactive = scheme.onSurfaceVariant.withValues(alpha: 0.55);
    final active = BookfolioDesignTokens.primary;

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(
          sigmaX: BookfolioDesignTokens.glassBlurSigma,
          sigmaY: BookfolioDesignTokens.glassBlurSigma,
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: BookfolioDesignTokens.surface
                .withValues(alpha: BookfolioDesignTokens.glassSurfaceOpacity),
            boxShadow: BookfolioDesignTokens.ambientShadowPrimary(),
          ),
          child: SafeArea(
            top: false,
            minimum: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(4, 10, 4, 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _NavItem(
                    selected: currentIndex == 0,
                    iconOutlined: Icons.home_outlined,
                    iconFilled: Icons.home,
                    label: '홈',
                    activeColor: active,
                    inactiveColor: inactive,
                    onTap: () => onChanged(0),
                  ),
                  _NavItem(
                    selected: currentIndex == 1,
                    iconOutlined: Icons.local_library_outlined,
                    iconFilled: Icons.local_library,
                    label: '서가',
                    activeColor: active,
                    inactiveColor: inactive,
                    onTap: () => onChanged(1),
                  ),
                  _NavItem(
                    selected: currentIndex == 2,
                    iconOutlined: Icons.explore_outlined,
                    iconFilled: Icons.explore,
                    label: '발견',
                    activeColor: active,
                    inactiveColor: inactive,
                    onTap: () => onChanged(2),
                  ),
                  _NavItem(
                    selected: currentIndex == 3,
                    iconOutlined: Icons.insights_outlined,
                    iconFilled: Icons.insights,
                    label: '통계',
                    activeColor: active,
                    inactiveColor: inactive,
                    onTap: () => onChanged(3),
                  ),
                  _NavItem(
                    selected: currentIndex == 4,
                    iconOutlined: Icons.person_outline,
                    iconFilled: Icons.person,
                    label: '프로필',
                    activeColor: active,
                    inactiveColor: inactive,
                    onTap: () => onChanged(4),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.selected,
    required this.iconOutlined,
    required this.iconFilled,
    required this.label,
    required this.activeColor,
    required this.inactiveColor,
    required this.onTap,
  });

  final bool selected;
  final IconData iconOutlined;
  final IconData iconFilled;
  final String label;
  final Color activeColor;
  final Color inactiveColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = selected ? activeColor : inactiveColor;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              selected ? iconFilled : iconOutlined,
              size: 22,
              color: c,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.manrope(
                fontSize: 11,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                letterSpacing: 0.5,
                color: c,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
