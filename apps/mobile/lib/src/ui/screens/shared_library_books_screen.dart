import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/models/shared_library_models.dart';
import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/ui/screens/shared_library_book_detail_screen.dart';
import 'package:bookfolio_mobile/src/ui/widgets/book_grid_card.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 공동서재 한 곳의 도서 목록(내 서재와 동일한 표지 그리드).
///
/// History:
/// - 2026-03-25: 그리드·탭 시 `SharedLibraryBookDetailScreen`으로 이동
class SharedLibraryBooksScreen extends StatefulWidget {
  const SharedLibraryBooksScreen({
    super.key,
    required this.libraryId,
    required this.libraryName,
  });

  final String libraryId;
  final String libraryName;

  @override
  State<SharedLibraryBooksScreen> createState() => _SharedLibraryBooksScreenState();
}

class _SharedLibraryBooksScreenState extends State<SharedLibraryBooksScreen> {
  final BookfolioApi _api = BookfolioApi();
  List<SharedLibraryBookSummary> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (!mounted) return;
      final auth = context.read<AuthController>();
      _api.accessToken = () => auth.session?.accessToken;
      _load();
    });
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await _api.fetchSharedLibraryBooks(widget.libraryId);
      if (!mounted) return;
      setState(() {
        _items = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _openBook(SharedLibraryBookSummary book) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => SharedLibraryBookDetailScreen(
          book: book,
          libraryName: widget.libraryName,
        ),
      ),
    );
  }

  Widget? _coverBadge(SharedLibraryBookSummary b) {
    if (b.owners.isEmpty) return null;
    if (b.owners.length > 1) {
      return OwnerCountCoverBadge(count: b.owners.length);
    }
    try {
      final st = ReadingStatus.values.byName(b.owners.first.readingStatus);
      return ReadingStatusCoverBadge(status: st);
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.libraryName),
        backgroundColor: const Color(0xFFEDE4D8),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
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
          onRefresh: _load,
          color: colorScheme.primary,
          child: _loading
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: const [
                    SizedBox(height: 120),
                    Center(child: CircularProgressIndicator()),
                  ],
                )
              : _error != null
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(24),
                      children: [
                        Text(_error!, style: TextStyle(color: colorScheme.error)),
                      ],
                    )
                  : _items.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(24),
                          children: const [
                            Text('이 서재에 등록된 책이 없습니다.'),
                          ],
                        )
                      : CustomScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          slivers: [
                            SliverToBoxAdapter(
                              child: Padding(
                                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                                child: Text(
                                  '총 ${_items.length}권',
                                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                        color: const Color(0xFF5C4A3A),
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                              ),
                            ),
                            SliverPadding(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
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
                                        final b = _items[index];
                                        final authors = b.authors.isNotEmpty ? b.authors.join(', ') : '';
                                        return BookGridCard(
                                          title: b.title,
                                          authorsLine: authors,
                                          coverUrl: b.coverUrl,
                                          gradientSeedA: b.title,
                                          gradientSeedB: b.bookId,
                                          coverBadge: _coverBadge(b),
                                          onTap: () => _openBook(b),
                                        );
                                      },
                                      childCount: _items.length,
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
        ),
      ),
    );
  }
}
