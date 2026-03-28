import 'dart:math' as math;

import 'package:bookfolio_mobile/src/models/shared_library_models.dart';
import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/ui/screens/shared_library_book_detail_screen.dart';
import 'package:bookfolio_mobile/src/ui/widgets/book_grid_card.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 공동서재 한 곳의 도서 목록(표지 그리드·소유자 뱃지·검색·분류·페이지).
///
/// History:
/// - 2026-03-29: 페이지 바 하단 — `viewPadding`·추가 여백으로 제스처 내비바에 가리지 않음
/// - 2026-03-29: 웹과 유사한 소유자 칩·장르·소유자 필터·검색·페이지네이션·다크 테마
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
  static const int _pageSize = 18;

  final BookfolioApi _api = BookfolioApi();
  final _searchCtrl = TextEditingController();

  List<SharedLibraryBookSummary> _all = const [];
  bool _loading = true;
  String? _error;

  String _searchQuery = '';
  String? _genreSlug;
  String? _ownerUserId;
  int _page = 1;

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

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
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
        _all = list;
        _loading = false;
        _page = 1;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  List<String> _collectGenres() {
    final set = <String>{};
    for (final b in _all) {
      for (final g in b.genreSlugs ?? []) {
        final t = g.trim();
        if (t.isNotEmpty) set.add(t);
      }
    }
    final out = set.toList();
    out.sort((a, b) => a.compareTo(b));
    return out;
  }

  List<({String userId, String label})> _collectOwners() {
    final map = <String, String>{};
    for (final b in _all) {
      for (final o in b.owners) {
        map[o.userId] = o.displayName;
      }
    }
    final out = map.entries.map((e) => (userId: e.key, label: e.value)).toList();
    out.sort((a, b) => a.label.compareTo(b.label));
    return out;
  }

  List<SharedLibraryBookSummary> _filtered() {
    var list = List<SharedLibraryBookSummary>.from(_all);
    final q = _searchQuery.trim().toLowerCase();
    if (q.isNotEmpty) {
      list = list.where((b) {
        if (b.title.toLowerCase().contains(q)) return true;
        if ((b.isbn ?? '').toLowerCase().contains(q)) return true;
        for (final a in b.authors) {
          if (a.toLowerCase().contains(q)) return true;
        }
        for (final o in b.owners) {
          if (o.displayName.toLowerCase().contains(q)) return true;
        }
        return false;
      }).toList();
    }
    final g = _genreSlug?.trim();
    if (g != null && g.isNotEmpty) {
      list = list.where((b) => (b.genreSlugs ?? []).contains(g)).toList();
    }
    final oid = _ownerUserId?.trim();
    if (oid != null && oid.isNotEmpty) {
      list = list.where((b) => b.owners.any((o) => o.userId == oid)).toList();
    }
    return list;
  }

  void _applySearchField() {
    setState(() {
      _searchQuery = _searchCtrl.text;
      _page = 1;
    });
  }

  void _setGenre(String? slug) {
    setState(() {
      _genreSlug = slug;
      _page = 1;
    });
  }

  void _setOwner(String? userId) {
    setState(() {
      _ownerUserId = userId;
      _page = 1;
    });
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

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    // 제스처·3버튼 내비 바 높이 + 살짝 여유
    final pagerBottomPad =
        24 + MediaQuery.viewPaddingOf(context).bottom + 16;
    final filtered = _filtered();
    final totalPages = math.max(1, (filtered.length + _pageSize - 1) ~/ _pageSize);
    final page = math.min(_page, totalPages);
    final start = (page - 1) * _pageSize;
    final pageItems = start >= filtered.length
        ? <SharedLibraryBookSummary>[]
        : filtered.sublist(start, math.min(start + _pageSize, filtered.length));

    final genres = _collectGenres();
    final owners = _collectOwners();

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.libraryName),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: DecoratedBox(
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
                  : CustomScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      slivers: [
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                          sliver: SliverToBoxAdapter(
                            child: SearchBar(
                              controller: _searchCtrl,
                              hintText: '제목·저자·ISBN·소유자 검색',
                              leading: const Icon(Icons.search),
                              trailing: [
                                IconButton(
                                  onPressed: _applySearchField,
                                  icon: const Icon(Icons.check_circle_outline),
                                  tooltip: '검색 적용',
                                ),
                              ],
                              onSubmitted: (_) => _applySearchField(),
                            ),
                          ),
                        ),
                        if (genres.isNotEmpty)
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.only(left: 12, right: 12, bottom: 8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('장르', style: textTheme.labelLarge?.copyWith(color: colorScheme.onSurfaceVariant)),
                                  const SizedBox(height: 6),
                                  SingleChildScrollView(
                                    scrollDirection: Axis.horizontal,
                                    child: Row(
                                      children: [
                                        Padding(
                                          padding: const EdgeInsets.only(right: 6),
                                          child: FilterChip(
                                            label: const Text('전체'),
                                            selected: _genreSlug == null,
                                            onSelected: (v) {
                                              if (v) _setGenre(null);
                                            },
                                            selectedColor: colorScheme.secondaryContainer,
                                          ),
                                        ),
                                        ...genres.map(
                                          (g) => Padding(
                                            padding: const EdgeInsets.only(right: 6),
                                            child: FilterChip(
                                              label: Text(g),
                                              selected: _genreSlug == g,
                                              onSelected: (v) => _setGenre(v ? g : null),
                                              selectedColor: colorScheme.secondaryContainer,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        if (owners.length > 1 || _ownerUserId != null)
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.only(left: 12, right: 12, bottom: 8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('소유자', style: textTheme.labelLarge?.copyWith(color: colorScheme.onSurfaceVariant)),
                                  const SizedBox(height: 6),
                                  SingleChildScrollView(
                                    scrollDirection: Axis.horizontal,
                                    child: Row(
                                      children: [
                                        Padding(
                                          padding: const EdgeInsets.only(right: 6),
                                          child: FilterChip(
                                            label: const Text('전체'),
                                            selected: _ownerUserId == null,
                                            onSelected: (v) {
                                              if (v) _setOwner(null);
                                            },
                                            selectedColor: colorScheme.secondaryContainer,
                                          ),
                                        ),
                                        ...owners.map(
                                          (o) => Padding(
                                            padding: const EdgeInsets.only(right: 6),
                                            child: FilterChip(
                                              label: Text(o.label),
                                              selected: _ownerUserId == o.userId,
                                              onSelected: (v) => _setOwner(v ? o.userId : null),
                                              selectedColor: colorScheme.secondaryContainer,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                            child: Text(
                              _all.isEmpty
                                  ? '총 0권'
                                  : '전체 ${_all.length}권 · 표시 ${filtered.length}권 · $page/$totalPages쪽',
                              style: textTheme.titleSmall?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        if (filtered.isEmpty)
                          SliverFillRemaining(
                            hasScrollBody: false,
                            child: Center(
                              child: Padding(
                                padding: const EdgeInsets.all(24),
                                child: Text(
                                  _all.isEmpty
                                      ? '이 서재에 등록된 책이 없습니다.'
                                      : '조건에 맞는 책이 없습니다.',
                                  textAlign: TextAlign.center,
                                  style: textTheme.bodyLarge?.copyWith(color: colorScheme.onSurfaceVariant),
                                ),
                              ),
                            ),
                          )
                        else ...[
                          SliverPadding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
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
                                      final b = pageItems[index];
                                      final authors = b.authors.isNotEmpty ? b.authors.join(', ') : '';
                                      final ownerLabels = b.owners.map((o) => o.displayName).toList();
                                      return BookGridCard(
                                        title: b.title,
                                        authorsLine: authors,
                                        coverUrl: b.coverUrl,
                                        ownerBadgeLabels: ownerLabels,
                                        gradientSeedA: b.title,
                                        gradientSeedB: b.bookId,
                                        onTap: () => _openBook(b),
                                      );
                                    },
                                    childCount: pageItems.length,
                                  ),
                                );
                              },
                            ),
                          ),
                          if (totalPages > 1)
                            SliverToBoxAdapter(
                              child: Padding(
                                padding: EdgeInsets.fromLTRB(16, 0, 16, pagerBottomPad),
                                child: Material(
                                  color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.9),
                                  borderRadius: BorderRadius.circular(12),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 4),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        IconButton(
                                          onPressed: page > 1
                                              ? () => setState(() => _page -= 1)
                                              : null,
                                          icon: const Icon(Icons.chevron_left),
                                        ),
                                        Text('$page / $totalPages', style: textTheme.titleSmall),
                                        IconButton(
                                          onPressed: page < totalPages
                                              ? () => setState(() => _page += 1)
                                              : null,
                                          icon: const Icon(Icons.chevron_right),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
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
