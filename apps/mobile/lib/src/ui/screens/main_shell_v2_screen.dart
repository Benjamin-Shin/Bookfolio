import 'dart:ui' show ImageFilter;

import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/screens/book_form_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/bestseller_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/choice_new_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/discover_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/home/home_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/library/library_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/library/library_analysis_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/etc/profile_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/shared_library/shared_libraries_screen.dart';
import 'package:seogadam_mobile/src/ui/layout/bookfolio_navigation_drawer.dart';
import 'package:seogadam_mobile/src/ui/layout/main_shell_tab_scope.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

/// 메인 5탭 쉘 — 글래스 앱바·하단 내비·드로어.
///
/// History:
/// - 2026-05-12: 드로어에서 내 서가 통계·베스트·초이스 — `open*InShell`로 본문 [Navigator] 푸시(상·하단 유지)
/// - 2026-05-12: `_goTab` 시 본문 [Navigator] `popUntil` 첫 라우트 — 베스트/초이스 등 덮인 채로 탭만 바뀌던 문제 수정
/// - 2026-05-12: [MainShellTabScope] — 발견 브레드크럼 등에서 `goTab` 노출
/// - 2026-05-12: `body`에 중첩 [Navigator] — [ProfileScreen]을 루트가 아닌 쉘 내부 스택에서 열어 상·하단 유지
/// - 2026-05-12: `_discoverRefreshSignal` — 발견 탭 재선택·프로필 복귀 시 관심 CID 재로드
/// - 2026-05-12: 프로필·통계 푸시 시 `embeddedInShell: true`로 본문만(쉘 앱바와 맞춤)
class MainShellScreen extends StatefulWidget {
  const MainShellScreen({super.key});

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final GlobalKey<NavigatorState> _shellBodyNavKey = GlobalKey<NavigatorState>();

  final ValueNotifier<int> _tabIndexNotifier = ValueNotifier<int>(0);
  final ValueNotifier<int> _homeRefreshNotifier = ValueNotifier<int>(0);
  final ValueNotifier<int> _discoverRefreshNotifier = ValueNotifier<int>(0);

  late final Listenable _shellTabsListenable;

  String? _toolbarAvatarUrl;

  @override
  void initState() {
    super.initState();
    _shellTabsListenable = Listenable.merge([
      _tabIndexNotifier,
      _homeRefreshNotifier,
      _discoverRefreshNotifier,
    ]);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadToolbarAvatar());
  }

  @override
  void dispose() {
    _tabIndexNotifier.dispose();
    _homeRefreshNotifier.dispose();
    _discoverRefreshNotifier.dispose();
    super.dispose();
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

  void _openDrawer() => _scaffoldKey.currentState?.openDrawer();

  void _popShellBodyToTabStack() {
    final nav = _shellBodyNavKey.currentState;
    if (nav != null && nav.canPop()) {
      nav.popUntil((route) => route.isFirst);
    }
  }

  void _goTab(int tabIndex) {
    final was = _tabIndexNotifier.value;
    _popShellBodyToTabStack();
    if (was == tabIndex) {
      return;
    }
    _tabIndexNotifier.value = tabIndex;
    if (tabIndex == 0 && was != 0) {
      _homeRefreshNotifier.value++;
    }
    if (tabIndex == 3 && was != 3) {
      _discoverRefreshNotifier.value++;
    }
    setState(() {});
  }

  String _titleForTab() {
    switch (_tabIndexNotifier.value) {
      case 1:
        return '내 서가';
      case 2:
        return '모임서가';
      case 3:
        return '발견';
      case 0:
      default:
        return '홈';
    }
  }

  Future<void> _openProfileInShell() async {
    await _shellBodyNavKey.currentState?.push<void>(
      MaterialPageRoute<void>(
        builder: (_) => const ProfileScreen(embeddedInShell: true),
      ),
    );
    if (!mounted) return;
    _discoverRefreshNotifier.value++;
    setState(() {});
    await _loadToolbarAvatar();
  }

  Future<void> _openLibraryStatsInShell() async {
    await _shellBodyNavKey.currentState?.push<void>(
      MaterialPageRoute<void>(
        builder: (_) => const LibraryAnalysisScreen(embeddedInShell: true),
      ),
    );
  }

  Future<void> _openBestsellerInShell() async {
    await _shellBodyNavKey.currentState?.push<void>(
      MaterialPageRoute<void>(
        builder: (_) => const BestsellerScreen(embeddedInShell: true),
      ),
    );
  }

  Future<void> _openChoiceNewInShell() async {
    await _shellBodyNavKey.currentState?.push<void>(
      MaterialPageRoute<void>(
        builder: (_) => const ChoiceNewScreen(embeddedInShell: true),
      ),
    );
  }

  Future<void> _goAddBook() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const BookFormScreen()),
    );
    if (!mounted) return;
    _goTab(0);
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;
    final scheme = Theme.of(context).colorScheme;
    final glassSurface = scheme.surface;
    final appBarFg = scheme.onSurface;
    return MainShellTabScope(
      goTab: _goTab,
      child: Scaffold(
      key: _scaffoldKey,
      extendBody: true,
      drawer: BookfolioNavigationDrawer(
        onTapMyLibrary: () => _goTab(1),
        onTapSharedLibrary: () => _goTab(2),
        openProfileInShell: _openProfileInShell,
        openLibraryStatsInShell: _openLibraryStatsInShell,
        openBestsellerInShell: _openBestsellerInShell,
        openChoiceNewInShell: _openChoiceNewInShell,
      ),
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(topInset + 56),
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(
              sigmaX: BookfolioDesignTokens.glassBlurSigma,
              sigmaY: BookfolioDesignTokens.glassBlurSigma,
            ),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: glassSurface.withValues(
                  alpha: BookfolioDesignTokens.glassSurfaceOpacity,
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: SizedBox(
                  height: 56,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        IconButton(
                          onPressed: _openDrawer,
                          icon: Icon(
                            Icons.menu_rounded,
                            color: appBarFg,
                          ),
                          tooltip: '메뉴',
                        ),
                        Expanded(
                          child: Text(
                            _titleForTab(),
                            textAlign: TextAlign.center,
                            style: GoogleFonts.manrope(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: appBarFg,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: _openProfileInShell,
                          tooltip: '내 프로필',
                          icon: ProfileToolbarAvatar(
                            imageUrl: _toolbarAvatarUrl,
                            size: 40,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      body: Navigator(
        key: _shellBodyNavKey,
        initialRoute: '/',
        onGenerateRoute: (RouteSettings settings) {
          if (settings.name != '/') {
            return MaterialPageRoute<void>(
              builder: (_) => const SizedBox.shrink(),
            );
          }
          return MaterialPageRoute<void>(
            settings: settings,
            builder: (_) => ListenableBuilder(
              listenable: _shellTabsListenable,
              builder: (context, _) {
                final tabIndex = _tabIndexNotifier.value;
                return IndexedStack(
                  index: tabIndex,
                  children: [
                    BookfolioHomeScreen(
                      refreshSignal: _homeRefreshNotifier.value,
                      onOpenSharedLibraries: () => _goTab(2),
                      onOpenMyLibrary: () => _goTab(1),
                      onOpenStats: () {
                        _openLibraryStatsInShell();
                      },
                    ),
                    const LibraryScreen(),
                    const SharedLibrariesScreen(embeddedInShell: true),
                    DiscoverScreen(
                      embeddedInShell: true,
                      refreshSignal: _discoverRefreshNotifier.value,
                    ),
                  ],
                );
              },
            ),
          );
        },
      ),
      bottomNavigationBar: _BookfolioBottomNavBar(
        currentIndex: _tabIndexNotifier.value,
        onChanged: _goTab,
        onTapAdd: _goAddBook,
      ),
    ),
    );
  }
}

class _BookfolioBottomNavBar extends StatelessWidget {
  const _BookfolioBottomNavBar({
    required this.currentIndex,
    required this.onChanged,
    required this.onTapAdd,
  });

  final int currentIndex;
  final ValueChanged<int> onChanged;
  final VoidCallback onTapAdd;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final inactive = scheme.onSurfaceVariant.withValues(alpha: 0.6);
    final active = scheme.primary;

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(
          sigmaX: BookfolioDesignTokens.glassBlurSigma,
          sigmaY: BookfolioDesignTokens.glassBlurSigma,
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: scheme.surface
                .withValues(alpha: BookfolioDesignTokens.glassSurfaceOpacity),
            boxShadow: BookfolioDesignTokens.ambientShadowPrimary(),
          ),
          child: SafeArea(
            top: false,
            minimum: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
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
                    label: '내 서가',
                    activeColor: active,
                    inactiveColor: inactive,
                    onTap: () => onChanged(1),
                  ),
                  _CenterAddButton(onTap: onTapAdd),
                  _NavItem(
                    selected: currentIndex == 2,
                    iconOutlined: Icons.groups_2_outlined,
                    iconFilled: Icons.groups_2,
                    label: '모임서가',
                    activeColor: active,
                    inactiveColor: inactive,
                    onTap: () => onChanged(2),
                  ),
                  _NavItem(
                    selected: currentIndex == 3,
                    iconOutlined: Icons.explore_outlined,
                    iconFilled: Icons.explore,
                    label: '발견',
                    activeColor: active,
                    inactiveColor: inactive,
                    onTap: () => onChanged(3),
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

class _CenterAddButton extends StatelessWidget {
  const _CenterAddButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        width: 52,
        height: 52,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: BookfolioDesignTokens.primary,
        ),
        child: const Icon(Icons.add, color: Colors.white, size: 30),
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
            Icon(selected ? iconFilled : iconOutlined, size: 22, color: c),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.manrope(
                fontSize: 11,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                letterSpacing: 0.4,
                color: c,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
