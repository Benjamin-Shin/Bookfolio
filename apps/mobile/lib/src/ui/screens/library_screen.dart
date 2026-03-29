import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/ui/book_ui_labels.dart';
import 'package:bookfolio_mobile/src/ui/screens/book_detail_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/bestseller_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/choice_new_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/book_form_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/bookfolio_aggregate_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/my_stats_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/profile_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/shared_libraries_screen.dart';
import 'package:bookfolio_mobile/src/ui/widgets/book_grid_card.dart';
import 'package:bookfolio_mobile/src/ui/widgets/main_hub_top_nav.dart';
import 'package:bookfolio_mobile/src/util/bookfolio_web_urls.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

/// 내 서재 그리드.
///
/// History:
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
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (!mounted) return;
      final lib = context.read<LibraryController>();
      _searchCtrl.text = lib.booksSearchQuery;
      lib.loadBooks();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _openBook(UserBook book) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => BookDetailScreen(book: book)),
    );
  }

  Future<void> _openBookfolioWebPath(BuildContext context, String path) async {
    final uri = bookfolioWebPageUri(path);
    if (!uri.hasScheme || uri.host.isEmpty) {
      if (context.mounted) {
        ScaffoldMessenger.maybeOf(context)?.showSnackBar(
          const SnackBar(content: Text('웹 주소(BOOKFOLIO_API_BASE_URL)가 설정되지 않았습니다.')),
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

  Widget _emptyOrFilteredPlaceholder(
    LibraryController library,
    Future<void> Function() onAddTap,
  ) {
    final hasFilters = library.booksSearchQuery.isNotEmpty ||
        library.booksReadingStatusFilter != null;
    if (library.booksTotal == 0 && !hasFilters) {
      return _EmptyLibrary(onAddTap: onAddTap);
    }
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(
          hasFilters
              ? '조건에 맞는 책이 없습니다. 검색어나 필터를 바꿔 보세요.'
              : '이 페이지에 표시할 책이 없습니다.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
      ),
    );
  }

  List<Widget> _readingStatusFilterChips(
    LibraryController library,
    ColorScheme colorScheme,
    TextTheme textTheme,
  ) {
    String? selected = library.booksReadingStatusFilter;
    Widget chip(String label, String? apiValue) {
      final on = apiValue == null ? selected == null : selected == apiValue;
      return Padding(
        padding: const EdgeInsets.only(right: 6),
        child: FilterChip(
          label: Text(label, style: textTheme.labelMedium),
          selected: on,
          onSelected: (v) async {
            if (!v) return;
            if (apiValue == null) {
              await library.setBooksListFilters(readingStatusAll: true);
            } else {
              await library.setBooksListFilters(readingStatus: apiValue);
            }
          },
          selectedColor: colorScheme.secondaryContainer,
          checkmarkColor: colorScheme.onSecondaryContainer,
        ),
      );
    }

    return [
      chip('전체', null),
      chip(readingStatusLabelKo(ReadingStatus.unread), 'unread'),
      chip(readingStatusLabelKo(ReadingStatus.reading), 'reading'),
      chip(readingStatusLabelKo(ReadingStatus.completed), 'completed'),
      chip(readingStatusLabelKo(ReadingStatus.paused), 'paused'),
      chip(readingStatusLabelKo(ReadingStatus.dropped), 'dropped'),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final library = context.watch<LibraryController>();
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final onSurface = colorScheme.onSurface;
    final onSurfaceVar = colorScheme.onSurfaceVariant;

    return Scaffold(
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(
                  color: colorScheme.primaryContainer.withValues(alpha: 0.4)),
              child: Text(
                '메뉴',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: colorScheme.onPrimaryContainer,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.collections_bookmark_outlined),
              title: const Text('내 서재'),
              onTap: () => Navigator.pop(context),
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
              title: const Text('북폴리오 집계'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push<void>(
                  MaterialPageRoute(
                      builder: (_) => const BookfolioAggregateScreen()),
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
                Navigator.of(context).push<void>(
                  MaterialPageRoute(
                      builder: (_) => const SharedLibrariesScreen()),
                );
              },
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
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
      ),
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SvgPicture.asset(
              'assets/brand/bookfolio_logo.svg',
              width: 26,
              height: 26,
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Text.rich(
                TextSpan(
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: onSurface,
                      ),
                  children: [
                    const TextSpan(text: '북폴리오'),
                    TextSpan(
                      text: ' - ',
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        color: onSurfaceVar,
                      ),
                    ),
                    const TextSpan(text: '내 서재'),
                  ],
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => context.read<AuthController>().signOut(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const BookFormScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('책 추가'),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const MainHubTopNavBar(current: MainHubTab.library),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: SearchBar(
              controller: _searchCtrl,
              hintText: '제목·저자·ISBN 검색',
              leading: const Icon(Icons.search),
              trailing: [
                IconButton(
                  onPressed: () async {
                    await library.setBooksListFilters(search: _searchCtrl.text);
                    if (context.mounted) FocusScope.of(context).unfocus();
                  },
                  icon: const Icon(Icons.check_circle_outline),
                  tooltip: '검색 적용',
                ),
              ],
              onSubmitted: (v) => library.setBooksListFilters(search: v),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 12, right: 12, bottom: 6),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: _readingStatusFilterChips(library, colorScheme, textTheme)),
            ),
          ),
          if (library.ownedBooksPriceStats != null &&
              library.ownedBooksPriceStats!.ownedCount > 0)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: _OwnedBooksPriceCard(
                stats: library.ownedBooksPriceStats!,
                colorScheme: colorScheme,
                textTheme: textTheme,
              ),
            ),
          Expanded(
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
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: library.loadBooks,
                      color: colorScheme.primary,
                      child: CustomScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        slivers: [
                    if (library.error != null)
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                          child: Material(
                            color: colorScheme.errorContainer
                                .withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 12),
                              child: Text(
                                library.error!,
                                style: TextStyle(
                                    color: colorScheme.onErrorContainer,
                                    fontSize: 13),
                              ),
                            ),
                          ),
                        ),
                      ),
                    if (library.isLoading)
                      const SliverFillRemaining(
                        hasScrollBody: false,
                        child: Center(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: CircularProgressIndicator(),
                          ),
                        ),
                      )
                    else if (library.books.isEmpty)
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: _emptyOrFilteredPlaceholder(
                          library,
                          () async {
                            await Navigator.of(context).push(
                              MaterialPageRoute(
                                  builder: (_) => const BookFormScreen()),
                            );
                          },
                        ),
                      )
                    else ...[
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                          child: Text(
                            library.booksTotal > 0
                                ? '총 ${library.booksTotal}권 · ${library.booksPage}/${library.booksTotalPages}쪽 (이쪽 ${library.books.length}권)'
                                : '총 0권',
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(
                                  color: colorScheme.onSurfaceVariant,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                        sliver: SliverLayoutBuilder(
                          builder: (context, constraints) {
                            final width = constraints.crossAxisExtent;
                            final columns = width >= 520 ? 3 : 2;
                            return SliverGrid(
                              gridDelegate:
                                  SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: columns,
                                mainAxisSpacing: 12,
                                crossAxisSpacing: 12,
                                childAspectRatio:
                                    bookGridCardAspectRatio(columns),
                              ),
                              delegate: SliverChildBuilderDelegate(
                                (context, index) {
                                  final book = library.books[index];
                                  return BookGridCard(
                                    title: book.title,
                                    authorsLine: book.authors.join(', '),
                                    coverUrl: book.coverUrl,
                                    gradientSeedA: book.title,
                                    gradientSeedB: book.id,
                                    coverBadge: ReadingStatusCoverBadge(
                                        status: book.readingStatus),
                                    onTap: () => _openBook(book),
                                  );
                                },
                                childCount: library.books.length,
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ],
                      ),
                    ),
                  ),
                  if (!library.isLoading &&
                      library.books.isNotEmpty &&
                      library.error == null)
                    SafeArea(
                      top: false,
                      minimum: EdgeInsets.only(
                        left: 12,
                        right: 12,
                        bottom: MediaQuery.viewPaddingOf(context).bottom + 72,
                      ),
                      child: _BooksPagerBar(
                        page: library.booksPage,
                        totalPages: library.booksTotalPages,
                        onPrev: library.canGoToPrevBooksPage
                            ? () => library.goToBooksPage(library.booksPage - 1)
                            : null,
                        onNext: library.canGoToNextBooksPage
                            ? () => library.goToBooksPage(library.booksPage + 1)
                            : null,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _formatKoGroupedInt(int n) {
  final s = n.toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
    buf.write(s[i]);
  }
  return buf.toString();
}

/// History:
/// - 2026-03-29: 웹 대시보드와 동일 문구·의미
class _OwnedBooksPriceCard extends StatelessWidget {
  const _OwnedBooksPriceCard({
    required this.stats,
    required this.colorScheme,
    required this.textTheme,
  });

  final UserOwnedBooksPriceStats stats;
  final ColorScheme colorScheme;
  final TextTheme textTheme;

  @override
  Widget build(BuildContext _) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: colorScheme.outline.withValues(alpha: 0.38),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '소장 책 가격 합계',
            style: textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 6),
          if (stats.pricedOwnedCount > 0)
            Text.rich(
              TextSpan(
                style: textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  height: 1.35,
                ),
                children: [
                  TextSpan(
                    text: '소장 ${_formatKoGroupedInt(stats.ownedCount)}권 중 '
                        '${_formatKoGroupedInt(stats.pricedOwnedCount)}권에 가격이 있어요. ',
                  ),
                  TextSpan(
                    text: '${_formatKoGroupedInt(stats.totalKrw)}원',
                    style: textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: colorScheme.onSurface,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            )
          else
            Text(
              '소장 ${_formatKoGroupedInt(stats.ownedCount)}권 — 책 등록·수정에서 가격(원)을 넣으면 '
              '여기에 합계가 표시됩니다.',
              style: textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
                height: 1.35,
              ),
            ),
          const SizedBox(height: 4),
          Text(
            '제공처·시점에 따라 실제 구매가와 다를 수 있는 참고 값입니다.',
            style: textTheme.labelSmall?.copyWith(
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.9),
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }
}

/// History:
/// - 2026-03-25: 표지 카드는 `BookGridCard` 위젯으로 분리
class _BooksPagerBar extends StatelessWidget {
  const _BooksPagerBar({
    required this.page,
    required this.totalPages,
    required this.onPrev,
    required this.onNext,
  });

  final int page;
  final int totalPages;
  final VoidCallback? onPrev;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: scheme.surfaceContainerHighest.withValues(alpha: 0.9),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(
              onPressed: onPrev,
              icon: const Icon(Icons.chevron_left),
              tooltip: '이전 쪽',
            ),
            Text('$page / $totalPages', style: Theme.of(context).textTheme.titleSmall),
            IconButton(
              onPressed: onNext,
              icon: const Icon(Icons.chevron_right),
              tooltip: '다음 쪽',
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyLibrary extends StatelessWidget {
  const _EmptyLibrary({required this.onAddTap});

  final Future<void> Function() onAddTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: scheme.outlineVariant),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              children: [
                Icon(
                  Icons.collections_bookmark_rounded,
                  size: 52,
                  color: Theme.of(context)
                      .colorScheme
                      .primary
                      .withValues(alpha: 0.85),
                ),
                const SizedBox(height: 16),
                Text(
                  '아직 등록한 책이 없어요',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: scheme.onSurface,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  '바코드 스캔이나 직접 입력으로 첫 권을 추가해보세요.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: scheme.onSurfaceVariant,
                        height: 1.35,
                      ),
                ),
                const SizedBox(height: 20),
                FilledButton.icon(
                  onPressed: () => onAddTap(),
                  icon: const Icon(Icons.add),
                  label: const Text('책 추가하기'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
