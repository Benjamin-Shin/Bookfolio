import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:bookfolio_mobile/src/ui/screens/book_detail_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/bestseller_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/choice_new_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/book_form_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/shared_libraries_screen.dart';
import 'package:bookfolio_mobile/src/ui/widgets/book_grid_card.dart';
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
            tooltip: '초이스 신간',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ChoiceNewScreen()),
              );
            },
            icon: const Icon(Icons.new_releases_outlined),
          ),
          IconButton(
            tooltip: '베스트셀러',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const BestsellerScreen()),
              );
            },
            icon: const Icon(Icons.local_fire_department_outlined),
          ),
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
                          childAspectRatio: bookGridCardAspectRatio(columns),
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
                              coverBadge: ReadingStatusCoverBadge(status: book.readingStatus),
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

/// History:
/// - 2026-03-25: 표지 카드는 `BookGridCard` 위젯으로 분리
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
