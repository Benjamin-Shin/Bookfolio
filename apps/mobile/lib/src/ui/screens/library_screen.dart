import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/util/cover_image_url.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/ui/book_ui_labels.dart';
import 'package:bookfolio_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:bookfolio_mobile/src/ui/screens/book_detail_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/book_form_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/shared_libraries_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (!mounted) return;
      context.read<LibraryController>().loadBooks();
    });
  }

  Future<void> _openBook(UserBook book) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => BookDetailScreen(book: book)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final library = context.watch<LibraryController>();
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
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
                        color: const Color(0xFF3E342C),
                      ),
                  children: const [
                    TextSpan(text: '북폴리오'),
                    TextSpan(
                      text: ' - ',
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF7A6A5C),
                      ),
                    ),
                    TextSpan(text: '내 서재'),
                  ],
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFFEDE4D8),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: '공동서재',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SharedLibrariesScreen()),
              );
            },
            icon: const Icon(Icons.groups_2_outlined),
          ),
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
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFF5EDE2),
              Color(0xFFE8DCC8),
            ],
          ),
        ),
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
                      color: colorScheme.errorContainer.withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        child: Text(
                          library.error!,
                          style: TextStyle(color: colorScheme.onErrorContainer, fontSize: 13),
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
                  child: _EmptyLibrary(onAddTap: () async {
                    await Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const BookFormScreen()),
                    );
                  }),
                )
              else ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                    child: Text(
                      '총 ${library.books.length}권',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: const Color(0xFF5C4A3A),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, kBookfolioFabClearancePadding),
                  sliver: SliverLayoutBuilder(
                    builder: (context, constraints) {
                      final width = constraints.crossAxisExtent;
                      final columns = width >= 520 ? 3 : 2;
                      return SliverGrid(
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: columns,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: _bookCardAspectRatio(columns),
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final book = library.books[index];
                            return _BookCard(
                              book: book,
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
    );
  }
}

/// 표지(2:3) + 하단 제목/메타 영역을 포함한 그리드 셀 비율 (너무 넓으면 하단 오버플로).
double _bookCardAspectRatio(int columns) {
  return switch (columns) {
    3 => 0.50,
    _ => 0.46,
  };
}

class _BookCard extends StatelessWidget {
  const _BookCard({
    required this.book,
    required this.onTap,
  });

  final UserBook book;
  final VoidCallback onTap;

  static const double _coverAspect = 2 / 3;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cover = resolveCoverImageUrl(book.coverUrl);
    final hasCover = cover != null;
    final authors = book.authors.join(', ');

    return Card(
      clipBehavior: Clip.antiAlias,
      elevation: 1.5,
      shadowColor: Colors.black26,
      surfaceTintColor: Colors.transparent,
      color: const Color(0xFFFFFBF7),
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: _coverAspect,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Positioned.fill(
                    child: hasCover
                        ? Image.network(
                            cover,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: double.infinity,
                            headers: kCoverImageRequestHeaders,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return ColoredBox(
                                color: const Color(0xFFE8E0D8),
                                child: Center(
                                  child: SizedBox(
                                    width: 28,
                                    height: 28,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: theme.colorScheme.primary,
                                    ),
                                  ),
                                ),
                              );
                            },
                            errorBuilder: (_, __, ___) => _CardTitlePanel(book: book),
                          )
                        : _CardTitlePanel(book: book),
                  ),
                  Positioned(
                    top: 6,
                    left: 6,
                    child: _ReadingStatusCoverBadge(status: book.readingStatus),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (hasCover)
                    Text(
                      book.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        height: 1.25,
                        color: const Color(0xFF3E342C),
                      ),
                    ),
                  if (hasCover && authors.isNotEmpty) const SizedBox(height: 4),
                  if (authors.isNotEmpty)
                    Text(
                      authors,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF6B5B4D),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// 표지 위 읽기 상태 — 어두운 배경 + 흰 아이콘으로 대비를 확보.
class _ReadingStatusCoverBadge extends StatelessWidget {
  const _ReadingStatusCoverBadge({required this.status});

  final ReadingStatus status;

  @override
  Widget build(BuildContext context) {
    final accent = _readingStatusColor(status);
    return Tooltip(
      message: readingStatusLabelKo(status),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: const Color(0xD9000000),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.38), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.35),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(5),
          child: Icon(
            _readingStatusIcon(status),
            size: 19,
            color: Color.lerp(Colors.white, accent, 0.2)!,
            shadows: const [
              Shadow(offset: Offset(0, 0.5), blurRadius: 2.5, color: Colors.black54),
            ],
          ),
        ),
      ),
    );
  }
}

IconData _readingStatusIcon(ReadingStatus s) {
  return switch (s) {
    ReadingStatus.unread => Icons.bookmark_border_rounded,
    ReadingStatus.reading => Icons.auto_stories_rounded,
    ReadingStatus.completed => Icons.check_circle_rounded,
    ReadingStatus.paused => Icons.pause_circle_rounded,
    ReadingStatus.dropped => Icons.bookmark_remove_rounded,
  };
}

/// 표지가 없거나 로드 실패 시 — 카드 상단에 책 제목을 표시.
class _CardTitlePanel extends StatelessWidget {
  const _CardTitlePanel({required this.book});

  final UserBook book;

  @override
  Widget build(BuildContext context) {
    final c1 = Color(0xFF000000 | (book.title.hashCode * 4999 & 0xFFFFFF));
    final c2 = Color(0xFF000000 | (book.id.hashCode * 7919 & 0xFFFFFF));
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color.lerp(c1, Colors.white, 0.4)!,
            Color.lerp(c2, Colors.black, 0.2)!,
          ],
        ),
      ),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Text(
            book.title,
            textAlign: TextAlign.center,
            maxLines: 5,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              height: 1.3,
              color: Color(0xF2FFFFFF),
              shadows: [
                Shadow(offset: Offset(0, 1), blurRadius: 3, color: Colors.black38),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

Color _readingStatusColor(ReadingStatus s) {
  return switch (s) {
    ReadingStatus.reading => const Color(0xFF2E7D32),
    ReadingStatus.completed => const Color(0xFF1565C0),
    ReadingStatus.unread => const Color(0xFF6D4C41),
    ReadingStatus.paused => const Color(0xFFF9A825),
    ReadingStatus.dropped => const Color(0xFF78909C),
  };
}

class _EmptyLibrary extends StatelessWidget {
  const _EmptyLibrary({required this.onAddTap});

  final Future<void> Function() onAddTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFFF0E6DA),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFD9CBB8)),
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
                  color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.85),
                ),
                const SizedBox(height: 16),
                Text(
                  '아직 등록한 책이 없어요',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF4E4034),
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  '바코드 스캔이나 직접 입력으로 첫 권을 추가해보세요.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF6B5B4D),
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
