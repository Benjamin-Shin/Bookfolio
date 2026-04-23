import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/book_ui_labels.dart';
import 'package:seogadam_mobile/src/ui/screens/book_detail_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/book_form_screen.dart';
import 'package:seogadam_mobile/src/ui/widgets/book_grid_card.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

/// 내 서가 종이책 목록: 검색·읽기 상태 탭·그리드·페이지네이션 (`LibraryScreen` 「내 책」).
///
/// History:
/// - 2026-04-05: 메인 「발견」탭과 분리 — 본 위젯은 서가 탭 전용
/// - 2026-04-05: 그리드 열 수 `bookfolioGridCrossAxisCount`(가용 폭·최소 타일 너비 기준)
/// - 2026-04-02: 그리드 `childAspectRatio` 가산(+0.12)으로 카드 하단 빈 여백 축소
/// - 2026-04-02: 검색 탭에서 소장 책 가격 합계 UI 제거
/// - 2026-04-05: 하단 페이지 바 패딩에 쉘 내비 `kBookfolioShellBottomNavClearance` 반영
/// - 2026-04-02: 읽기 상태를 `Wrap`으로 배치·좌우 패딩 축소·그리드 카드 `coverScale` 적용
/// - 2026-04-02: `LibraryScreen`에서 분리
/// - 2026-04-08: 목록 요청 타임아웃 시 저장 목록 확인 다이얼로그·로컬 캐시 배너
class LibraryBrowseTab extends StatefulWidget {
  const LibraryBrowseTab({super.key});

  @override
  State<LibraryBrowseTab> createState() => _LibraryBrowseTabState();
}

class _LibraryBrowseTabState extends State<LibraryBrowseTab> {
  late final TextEditingController _searchCtrl;
  LibraryController? _library;

  @override
  void initState() {
    super.initState();
    final lib = context.read<LibraryController>();
    _library = lib;
    _searchCtrl = TextEditingController(text: lib.booksSearchQuery);
    lib.addListener(_onLibraryChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      final l = context.read<LibraryController>();
      final fromTimeout = l.consumeBooksListLoadTimeoutPrompt();
      if (fromTimeout) {
        await _showOfflineCacheOfferDialog(context, l);
        if (mounted && l.books.isEmpty && !l.booksFromLocalCacheOnly) {
          await l.loadBooks();
        }
      } else {
        await l.loadBooks();
      }
    });
  }

  void _onLibraryChanged() {
    final lib = _library;
    if (!mounted || lib == null) return;
    if (lib.consumeBooksListLoadTimeoutPrompt()) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _showOfflineCacheOfferDialog(context, lib);
      });
    }
  }

  @override
  void dispose() {
    _library?.removeListener(_onLibraryChanged);
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _showOfflineCacheOfferDialog(
    BuildContext context,
    LibraryController library,
  ) async {
    final go = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('목록을 가져오지 못했어요'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '서버 응답이 너무 늦거나, 지금은 오프라인에 가깝습니다. '
                  '이 기기에 저장된 서가 목록을 불러올까요?',
                  style:
                      Theme.of(ctx).textTheme.bodyMedium?.copyWith(height: 1.4),
                ),
                const SizedBox(height: 8),
                Theme(
                  data:
                      Theme.of(ctx).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    tilePadding: EdgeInsets.zero,
                    title: Text(
                      '자세히',
                      style: Theme.of(ctx).textTheme.labelLarge,
                    ),
                    children: [
                      Text(
                        'Wi-Fi는 연결되어 있어도 인터넷이 되지 않거나, 서버가 바쁜 경우 목록 요청이 끊길 수 있습니다. '
                        '아래를 누르면 이전에 동기화해 둔 종이책 목록(검색·읽기 상태 필터를 쓰지 않았을 때 받아 둔 데이터)을 SQLite에서 불러옵니다. '
                        '화면에 보이는 내용은 마지막으로 목록을 성공적으로 받아온 시점의 스냅샷입니다.',
                        style: Theme.of(ctx).textTheme.bodySmall?.copyWith(
                              height: 1.4,
                              color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('닫기'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('저장된 목록 보기'),
            ),
          ],
        );
      },
    );
    if (go == true && context.mounted) {
      await library.applyDefaultPaperListFromLocalCache();
    }
  }

  Future<void> _openBook(UserBook book) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => BookDetailScreen(book: book)),
    );
    if (mounted) await context.read<LibraryController>().loadBooks();
  }

  Future<void> _applySearch(LibraryController library) async {
    await library.setBooksListFilters(search: _searchCtrl.text);
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

  String _localCacheSubtitle(LibraryController library) {
    final ms = library.localCacheLastSyncedAtMs;
    if (ms == null) {
      return '당겨서 새로고침하면 다시 서버에서 받아 옵니다.';
    }
    final when = DateFormat.yMMMd('ko_KR').add_Hm().format(
          DateTime.fromMillisecondsSinceEpoch(ms),
        );
    return '마지막으로 서버에서 받아 저장한 시각: $when. 당겨서 새로고침하면 최신 목록을 다시 요청합니다.';
  }

  List<Widget> _readingStatusFilterChips(
    LibraryController library,
    ColorScheme colorScheme,
    TextTheme textTheme,
  ) {
    final String? selected = library.booksReadingStatusFilter;
    Widget chip(String label, String? apiValue) {
      final on = apiValue == null ? selected == null : selected == apiValue;
      return FilterChip(
        label: Text(label, style: textTheme.labelMedium),
        selected: on,
        visualDensity: VisualDensity.compact,
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
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

    return ColoredBox(
      color: colorScheme.surfaceContainerLow,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Material(
            color: colorScheme.surfaceContainerHigh,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchCtrl,
                      textInputAction: TextInputAction.search,
                      decoration: const InputDecoration(
                        hintText: '제목·저자·ISBN',
                        border: OutlineInputBorder(),
                        isDense: true,
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      onSubmitted: (_) => _applySearch(library),
                    ),
                  ),
                  const SizedBox(width: 6),
                  FilledButton.tonal(
                    onPressed:
                        library.isLoading ? null : () => _applySearch(library),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                    ),
                    child: const Text('검색'),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 2, 8, 6),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children:
                  _readingStatusFilterChips(library, colorScheme, textTheme),
            ),
          ),
          if (library.booksFromLocalCacheOnly)
            Material(
              color: colorScheme.secondaryContainer.withValues(alpha: 0.65),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.sd_storage_outlined,
                      size: 22,
                      color: colorScheme.onSecondaryContainer,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '기기에 저장된 목록을 보고 있어요',
                            style: textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: colorScheme.onSecondaryContainer,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _localCacheSubtitle(library),
                            style: textTheme.bodySmall?.copyWith(
                              height: 1.35,
                              color: colorScheme.onSecondaryContainer
                                  .withValues(alpha: 0.92),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          if (library.error != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
              child: Material(
                color: colorScheme.errorContainer.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Text(
                    library.error!,
                    style: TextStyle(
                        color: colorScheme.onErrorContainer, fontSize: 13),
                  ),
                ),
              ),
            ),
          Expanded(
            child: library.isLoading
                ? const Center(child: CircularProgressIndicator())
                : library.books.isEmpty
                    ? _emptyOrFilteredPlaceholder(
                        library,
                        () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute<void>(
                                builder: (_) => const BookFormScreen()),
                          );
                          if (mounted) await library.loadBooks();
                        },
                      )
                    : RefreshIndicator(
                        onRefresh: () => library.loadBooks(),
                        color: colorScheme.primary,
                        child: CustomScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          slivers: [
                            SliverToBoxAdapter(
                              child: Padding(
                                padding:
                                    const EdgeInsets.fromLTRB(10, 8, 10, 6),
                                child: Text(
                                  library.booksFromLocalCacheOnly
                                      ? (library.books.isEmpty
                                          ? '저장된 목록 없음'
                                          : '기기 저장 목록 ${library.books.length}권 (네트워크 연결 후 새로고침하면 최신으로 바뀝니다)')
                                      : library.booksTotal > 0
                                          ? '총 ${library.booksTotal}권 · ${library.booksPage}/${library.booksTotalPages}쪽 (이쪽 ${library.books.length}권)'
                                          : '총 0권',
                                  style: textTheme.titleSmall?.copyWith(
                                    color: colorScheme.onSurfaceVariant,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                            SliverPadding(
                              padding: const EdgeInsets.fromLTRB(8, 0, 8, 24),
                              sliver: SliverLayoutBuilder(
                                builder: (context, constraints) {
                                  final width = constraints.crossAxisExtent;
                                  final columns = bookfolioGridCrossAxisCount(
                                    width,
                                    crossAxisSpacing: 10,
                                  );
                                  return SliverGrid(
                                    gridDelegate:
                                        SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: columns,
                                      mainAxisSpacing: 10,
                                      crossAxisSpacing: 10,
                                      // 표지·텍스트 높이에 맞춰 셀을 낮춤(하단 빈 여백 완화)
                                      childAspectRatio:
                                          bookGridCardAspectRatio(columns) +
                                              0.12,
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
                                          coverScale: 0.88,
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
                        ),
                      ),
          ),
          if (!library.isLoading &&
              library.books.isNotEmpty &&
              library.error == null &&
              !library.booksFromLocalCacheOnly)
            Material(
              color:
                  colorScheme.surfaceContainerHighest.withValues(alpha: 0.95),
              child: Padding(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.viewPaddingOf(context).bottom +
                      kBookfolioShellBottomNavClearance,
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
            ),
        ],
      ),
    );
  }
}

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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: onPrev,
            icon: const Icon(Icons.chevron_left),
            tooltip: '이전 쪽',
          ),
          Text(
            '$page / $totalPages',
            style: Theme.of(context).textTheme.titleSmall,
          ),
          IconButton(
            onPressed: onNext,
            icon: const Icon(Icons.chevron_right),
            tooltip: '다음 쪽',
          ),
        ],
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
