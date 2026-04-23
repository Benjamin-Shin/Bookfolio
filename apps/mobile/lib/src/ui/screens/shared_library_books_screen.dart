import 'dart:math' as math;
import 'dart:ui';

import 'package:seogadam_mobile/src/models/shared_library_models.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/screens/shared_library_book_detail_screen.dart';
import 'package:seogadam_mobile/src/ui/widgets/book_grid_card.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 공동서가 한 곳 — Stitch `모임서가` 목업에 가깝게(인용·멤버 스트립·2열 표지·활동·검색/필터).
///
/// History:
/// - 2026-04-12: 모임 표지 — 셀 2:3·클리핑·`BoxFit.contain`·소유자 전체 이름 칩
/// - 2026-04-06: 목업 정렬 — 히어로 인용·멤버 가로 스크롤·틸트 표지+오버랩 아바타·최근 활동·필터 패널 토글
/// - 2026-04-05: 그리드 열 수 `bookfolioGridCrossAxisCount`(가용 폭 기준)
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
  State<SharedLibraryBooksScreen> createState() =>
      _SharedLibraryBooksScreenState();
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
  bool _filtersOpen = false;

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
    final out =
        map.entries.map((e) => (userId: e.key, label: e.value)).toList();
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

  bool _isActiveReader(String userId) {
    return _all.any(
      (b) => b.owners
          .any((o) => o.userId == userId && o.readingStatus == 'reading'),
    );
  }

  SharedLibraryBookSummary? _quoteBook() {
    final withMemo = _all.where((b) {
      return b.owners.any((o) => (o.memoPreview ?? '').trim().isNotEmpty);
    }).toList();
    withMemo.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return withMemo.isEmpty ? null : withMemo.first;
  }

  String? _quoteText(SharedLibraryBookSummary b) {
    for (final o in b.owners) {
      final m = o.memoPreview?.trim();
      if (m != null && m.isNotEmpty) return m;
    }
    return null;
  }

  ({String name, String bookLine})? _quoteMeta(SharedLibraryBookSummary b) {
    SharedLibraryOwnerRow? picked;
    for (final o in b.owners) {
      if ((o.memoPreview ?? '').trim().isNotEmpty) {
        picked = o;
        break;
      }
    }
    picked ??= b.owners.isNotEmpty ? b.owners.first : null;
    if (picked == null) return null;
    final author = b.authors.isNotEmpty ? b.authors.join(', ') : '';
    final bookLine = author.isEmpty ? b.title : '$b.title ($author)';
    return (name: picked.displayName, bookLine: bookLine);
  }

  String _relativeTimeKo(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    var diff = DateTime.now().difference(dt);
    if (diff.isNegative) diff = Duration.zero;
    if (diff.inMinutes < 1) return '방금 전';
    if (diff.inHours < 1) return '${diff.inMinutes}분 전';
    if (diff.inHours < 24) return '${diff.inHours}시간 전';
    if (diff.inDays == 1) return '어제';
    if (diff.inDays < 7) return '${diff.inDays}일 전';
    return '${(diff.inDays / 7).floor()}주 전';
  }

  List<_MoimActivity> _activitiesForFeed() {
    final sorted = _filtered()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    final out = <_MoimActivity>[];
    for (final b in sorted.take(8)) {
      if (b.owners.isEmpty) continue;
      SharedLibraryOwnerRow? memoOwner;
      for (final o in b.owners) {
        if ((o.memoPreview ?? '').trim().isNotEmpty) {
          memoOwner = o;
          break;
        }
      }
      if (memoOwner != null) {
        final snippet = memoOwner.memoPreview!.trim();
        final short =
            snippet.length > 42 ? '${snippet.substring(0, 42)}…' : snippet;
        out.add(
          _MoimActivity(
            kind: _MoimActivityKind.memo,
            actor: memoOwner.displayName,
            bookTitle: b.title,
            detail: short,
            timeLabel: _relativeTimeKo(b.updatedAt),
          ),
        );
      } else {
        final actor = b.owners.first.displayName;
        out.add(
          _MoimActivity(
            kind: _MoimActivityKind.added,
            actor: actor,
            bookTitle: b.title,
            detail: null,
            timeLabel: _relativeTimeKo(b.updatedAt),
          ),
        );
      }
    }
    return out;
  }

  int _gridCrossAxisCount(double width) {
    final padded = width - 48;
    if (padded < 260) return 1;
    return 2;
  }

  double _moimTileAspect(int columns) {
    // crossAxis / mainAxis — 값을 키울수록 셀이 낮아져 표지+메타가 한 화면에 잘 들어감
    return columns >= 2 ? 0.58 : 0.52;
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final bottomSafe = MediaQuery.viewPaddingOf(context).bottom;
    final pagerBottomPad = 24 + bottomSafe + 16;
    final filtered = _filtered();
    final totalPages =
        math.max(1, (filtered.length + _pageSize - 1) ~/ _pageSize);
    final page = math.min(_page, totalPages);
    final start = (page - 1) * _pageSize;
    final pageItems = start >= filtered.length
        ? <SharedLibraryBookSummary>[]
        : filtered.sublist(start, math.min(start + _pageSize, filtered.length));

    final genres = _collectGenres();
    final owners = _collectOwners();
    final quoteBook = _quoteBook();
    final quoteBody = quoteBook == null ? null : _quoteText(quoteBook);
    final quoteMeta = quoteBook == null ? null : _quoteMeta(quoteBook);
    final activities = _activitiesForFeed();

    return Scaffold(
      backgroundColor: colorScheme.surface,
      extendBodyBehindAppBar: true,
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          setState(() => _filtersOpen = !_filtersOpen);
          if (_filtersOpen) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('검색·필터 패널을 열었어요.'),
                    behavior: SnackBarBehavior.floating,
                    duration: Duration(seconds: 2),
                  ),
                );
              }
            });
          }
        },
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        elevation: 6,
        shape: RoundedRectangleBorder(
            borderRadius:
                BorderRadius.circular(BookfolioDesignTokens.radiusMd)),
        child: const Icon(Icons.edit_note_rounded, size: 28),
      ),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(
          widget.libraryName,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style:
              BookfolioDesignTokens.headlineMd(colorScheme.onSurface).copyWith(
            fontSize: 22,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        backgroundColor: colorScheme.surface.withValues(alpha: 0.82),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        flexibleSpace: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child:
                ColoredBox(color: colorScheme.surface.withValues(alpha: 0.65)),
          ),
        ),
        actions: [
          IconButton(
            tooltip: '검색·필터',
            icon: Icon(
                _filtersOpen ? Icons.filter_alt : Icons.filter_alt_outlined),
            onPressed: () => setState(() => _filtersOpen = !_filtersOpen),
          ),
          PopupMenuButton<String>(
            tooltip: '더보기',
            onSelected: (value) {
              if (value == 'invite') {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('멤버 초대는 웹 서가담에서 진행할 수 있어요.'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'invite', child: Text('초대 안내')),
            ],
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
      ),
      body: Stack(
        children: [
          Positioned.fill(
              child: _PaperBackdrop(color: colorScheme.outlineVariant)),
          RefreshIndicator(
            onRefresh: _load,
            color: colorScheme.primary,
            edgeOffset: kToolbarHeight + MediaQuery.paddingOf(context).top,
            child: _loading
                ? CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      SliverToBoxAdapter(
                          child: SizedBox(
                              height: kToolbarHeight +
                                  MediaQuery.paddingOf(context).top +
                                  80)),
                      const SliverFillRemaining(
                        hasScrollBody: false,
                        child: Center(child: CircularProgressIndicator()),
                      ),
                    ],
                  )
                : _error != null
                    ? CustomScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        slivers: [
                          SliverToBoxAdapter(
                              child: SizedBox(
                                  height: kToolbarHeight +
                                      MediaQuery.paddingOf(context).top +
                                      24)),
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Text(_error!,
                                  style: TextStyle(color: colorScheme.error)),
                            ),
                          ),
                        ],
                      )
                    : CustomScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        slivers: [
                          SliverToBoxAdapter(
                            child: SizedBox(
                                height: kToolbarHeight +
                                    MediaQuery.paddingOf(context).top +
                                    8),
                          ),
                          if (_filtersOpen) ...[
                            SliverToBoxAdapter(
                              child: Padding(
                                padding:
                                    const EdgeInsets.fromLTRB(24, 0, 24, 8),
                                child: SearchBar(
                                  controller: _searchCtrl,
                                  hintText: '제목·저자·ISBN·소유자 검색',
                                  leading: const Icon(Icons.search),
                                  trailing: [
                                    IconButton(
                                      onPressed: _applySearchField,
                                      icon: const Icon(
                                          Icons.check_circle_outline),
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
                                  padding:
                                      const EdgeInsets.fromLTRB(20, 0, 20, 8),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '장르',
                                        style: textTheme.labelLarge?.copyWith(
                                            color:
                                                colorScheme.onSurfaceVariant),
                                      ),
                                      const SizedBox(height: 6),
                                      SingleChildScrollView(
                                        scrollDirection: Axis.horizontal,
                                        child: Row(
                                          children: [
                                            Padding(
                                              padding: const EdgeInsets.only(
                                                  right: 6),
                                              child: FilterChip(
                                                label: const Text('전체'),
                                                selected: _genreSlug == null,
                                                onSelected: (v) {
                                                  if (v) _setGenre(null);
                                                },
                                                selectedColor: colorScheme
                                                    .secondaryContainer,
                                              ),
                                            ),
                                            ...genres.map(
                                              (g) => Padding(
                                                padding: const EdgeInsets.only(
                                                    right: 6),
                                                child: FilterChip(
                                                  label: Text(g),
                                                  selected: _genreSlug == g,
                                                  onSelected: (v) =>
                                                      _setGenre(v ? g : null),
                                                  selectedColor: colorScheme
                                                      .secondaryContainer,
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
                                  padding:
                                      const EdgeInsets.fromLTRB(20, 0, 20, 12),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '소유자',
                                        style: textTheme.labelLarge?.copyWith(
                                            color:
                                                colorScheme.onSurfaceVariant),
                                      ),
                                      const SizedBox(height: 6),
                                      SingleChildScrollView(
                                        scrollDirection: Axis.horizontal,
                                        child: Row(
                                          children: [
                                            Padding(
                                              padding: const EdgeInsets.only(
                                                  right: 6),
                                              child: FilterChip(
                                                label: const Text('전체'),
                                                selected: _ownerUserId == null,
                                                onSelected: (v) {
                                                  if (v) _setOwner(null);
                                                },
                                                selectedColor: colorScheme
                                                    .secondaryContainer,
                                              ),
                                            ),
                                            ...owners.map(
                                              (o) => Padding(
                                                padding: const EdgeInsets.only(
                                                    right: 6),
                                                child: FilterChip(
                                                  label: Text(o.label),
                                                  selected:
                                                      _ownerUserId == o.userId,
                                                  onSelected: (v) => _setOwner(
                                                      v ? o.userId : null),
                                                  selectedColor: colorScheme
                                                      .secondaryContainer,
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
                          ],
                          if (quoteBody != null && quoteMeta != null)
                            SliverToBoxAdapter(
                              child: Padding(
                                padding:
                                    const EdgeInsets.fromLTRB(24, 16, 24, 0),
                                child: _MoimQuoteHero(
                                  quote: quoteBody,
                                  memberName: quoteMeta.name,
                                  bookLine: quoteMeta.bookLine,
                                ),
                              ),
                            ),
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: EdgeInsets.fromLTRB(
                                  24, quoteBody != null ? 28 : 16, 24, 0),
                              child: _MoimMembersSection(
                                members: owners
                                    .map(
                                      (o) => (
                                        userId: o.userId,
                                        label: o.label,
                                        active: _isActiveReader(o.userId),
                                      ),
                                    )
                                    .toList(),
                                onInvite: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content:
                                          Text('멤버 초대는 웹 서가담에서 진행할 수 있어요.'),
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                          SliverToBoxAdapter(
                            child: Padding(
                              padding:
                                  const EdgeInsets.fromLTRB(24, 28, 24, 12),
                              child: Text(
                                '공동의 서가',
                                style: BookfolioDesignTokens.headlineMd(
                                    colorScheme.onSurface),
                              ),
                            ),
                          ),
                          if (filtered.isEmpty && _all.isEmpty)
                            SliverToBoxAdapter(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 24, vertical: 32),
                                child: Text(
                                  '이 서가에 등록된 책이 없습니다.',
                                  textAlign: TextAlign.center,
                                  style: textTheme.bodyLarge?.copyWith(
                                      color: colorScheme.onSurfaceVariant),
                                ),
                              ),
                            )
                          else if (filtered.isEmpty)
                            SliverToBoxAdapter(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 24, vertical: 32),
                                child: Text(
                                  '조건에 맞는 책이 없습니다.',
                                  textAlign: TextAlign.center,
                                  style: textTheme.bodyLarge?.copyWith(
                                      color: colorScheme.onSurfaceVariant),
                                ),
                              ),
                            )
                          else
                            SliverLayoutBuilder(
                              builder: (context, constraints) {
                                final columns = _gridCrossAxisCount(
                                    constraints.crossAxisExtent);
                                final aspect = _moimTileAspect(columns);
                                final tileCount = pageItems.length + 1;
                                return SliverGrid(
                                  gridDelegate:
                                      SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: columns,
                                    mainAxisSpacing: 28,
                                    crossAxisSpacing: 24,
                                    childAspectRatio: aspect,
                                  ),
                                  delegate: SliverChildBuilderDelegate(
                                    (context, index) {
                                      if (index == pageItems.length) {
                                        return _MoimAddBookTile(
                                          onTap: () {
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              const SnackBar(
                                                content: Text(
                                                    '책 등록은 웹 서가담 또는 내 서가에서 이어서 할 수 있어요.'),
                                                behavior:
                                                    SnackBarBehavior.floating,
                                              ),
                                            );
                                          },
                                        );
                                      }
                                      final b = pageItems[index];
                                      return _MoimBookTile(
                                        book: b,
                                        styleIndex: index,
                                        onTap: () => _openBook(b),
                                      );
                                    },
                                    childCount: tileCount,
                                  ),
                                );
                              },
                            ),
                          if (totalPages > 1)
                            SliverToBoxAdapter(
                              child: Padding(
                                padding: EdgeInsets.fromLTRB(24, 8, 24, 8),
                                child: Material(
                                  color: colorScheme.surfaceContainerHighest
                                      .withValues(alpha: 0.9),
                                  borderRadius: BorderRadius.circular(
                                      BookfolioDesignTokens.radiusMd),
                                  child: Padding(
                                    padding:
                                        const EdgeInsets.symmetric(vertical: 4),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        IconButton(
                                          onPressed: page > 1
                                              ? () => setState(() => _page -= 1)
                                              : null,
                                          icon: const Icon(Icons.chevron_left),
                                        ),
                                        Text('$page / $totalPages',
                                            style: textTheme.titleSmall),
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
                          SliverToBoxAdapter(
                            child: Padding(
                              padding:
                                  const EdgeInsets.fromLTRB(24, 28, 24, 12),
                              child: Text(
                                '최근 활동',
                                style: BookfolioDesignTokens.headlineMd(
                                    colorScheme.onSurface),
                              ),
                            ),
                          ),
                          if (activities.isEmpty)
                            SliverToBoxAdapter(
                              child: Padding(
                                padding:
                                    const EdgeInsets.fromLTRB(24, 0, 24, 24),
                                child: Text(
                                  '아직 표시할 활동이 없어요. 책에 메모를 남기면 여기에 모여요.',
                                  style: textTheme.bodyMedium?.copyWith(
                                      color: colorScheme.onSurfaceVariant,
                                      height: 1.35),
                                ),
                              ),
                            )
                          else
                            SliverList(
                              delegate: SliverChildBuilderDelegate(
                                (context, i) {
                                  final a = activities[i];
                                  final dotColor = switch (i % 3) {
                                    0 => colorScheme.primary,
                                    1 => colorScheme.tertiary,
                                    _ => colorScheme.secondary,
                                  };
                                  final faded = i == activities.length - 1 &&
                                      activities.length > 2;
                                  return Padding(
                                    padding: const EdgeInsets.fromLTRB(
                                        24, 0, 24, 20),
                                    child: Opacity(
                                      opacity: faded ? 0.72 : 1,
                                      child: _MoimActivityTile(
                                          activity: a, dotColor: dotColor),
                                    ),
                                  );
                                },
                                childCount: activities.length,
                              ),
                            ),
                          SliverToBoxAdapter(
                              child: SizedBox(height: pagerBottomPad + 72)),
                        ],
                      ),
          ),
        ],
      ),
    );
  }
}

enum _MoimActivityKind { memo, added }

class _MoimActivity {
  const _MoimActivity({
    required this.kind,
    required this.actor,
    required this.bookTitle,
    this.detail,
    required this.timeLabel,
  });

  final _MoimActivityKind kind;
  final String actor;
  final String bookTitle;
  final String? detail;
  final String timeLabel;
}

/// 도트 패턴 배경 — HTML `.bg-paper`에 대응.
class _PaperBackdrop extends StatelessWidget {
  const _PaperBackdrop({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DotGridPainter(dotColor: color.withValues(alpha: 0.35)),
      child: const SizedBox.expand(),
    );
  }
}

class _DotGridPainter extends CustomPainter {
  _DotGridPainter({required this.dotColor});

  final Color dotColor;

  @override
  void paint(Canvas canvas, Size size) {
    const step = 24.0;
    final paint = Paint()..color = dotColor;
    for (var y = 0.0; y < size.height; y += step) {
      for (var x = 0.0; x < size.width; x += step) {
        canvas.drawCircle(Offset(x, y), 0.6, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DotGridPainter oldDelegate) =>
      oldDelegate.dotColor != dotColor;
}

class _MoimQuoteHero extends StatelessWidget {
  const _MoimQuoteHero({
    required this.quote,
    required this.memberName,
    required this.bookLine,
  });

  final String quote;
  final String memberName;
  final String bookLine;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '함께 쌓아가는 문장들',
          style: BookfolioDesignTokens.headlineMd(scheme.primary,
                  fontStyle: FontStyle.normal)
              .copyWith(
            fontSize: 26,
            fontWeight: FontWeight.w700,
            height: 1.15,
          ),
        ),
        const SizedBox(height: 20),
        Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned(
              left: -4,
              right: -4,
              top: -4,
              bottom: -4,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  gradient: LinearGradient(
                    colors: [
                      scheme.primary.withValues(alpha: 0.06),
                      scheme.tertiary.withValues(alpha: 0.05),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: scheme.primary.withValues(alpha: 0.07),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(22, 24, 22, 22),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerLowest,
                borderRadius:
                    BorderRadius.circular(BookfolioDesignTokens.radiusMd),
                border:
                    Border.all(color: BookfolioDesignTokens.ghostOutline(0.12)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Align(
                    alignment: Alignment.topRight,
                    child: Icon(
                      Icons.format_quote_rounded,
                      size: 36,
                      color: scheme.tertiary.withValues(alpha: 0.45),
                    ),
                  ),
                  Transform.translate(
                    offset: const Offset(0, -8),
                    child: Text(
                      '"$quote"',
                      style: BookfolioDesignTokens.headlineMd(scheme.onSurface,
                              fontStyle: FontStyle.italic)
                          .copyWith(
                        fontSize: 19,
                        height: 1.45,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundColor:
                            scheme.primaryContainer.withValues(alpha: 0.35),
                        child: Text(
                          memberName.isNotEmpty
                              ? memberName.characters.first
                              : '?',
                          style: TextStyle(
                            color: scheme.primary,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              memberName,
                              style: textThemeLabel(context).copyWith(
                                color: scheme.primary,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              bookLine,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: BookfolioDesignTokens.labelMd(
                                      scheme.onSurfaceVariant,
                                      opacity: 0.85)
                                  .copyWith(
                                fontSize: 10,
                                letterSpacing: 1.0,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  TextStyle textThemeLabel(BuildContext context) {
    return Theme.of(context).textTheme.bodyMedium ?? const TextStyle();
  }
}

class _MoimMembersSection extends StatelessWidget {
  const _MoimMembersSection({
    required this.members,
    required this.onInvite,
  });

  final List<({String userId, String label, bool active})> members;
  final VoidCallback onInvite;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Text(
                '함께하는 이들',
                style: BookfolioDesignTokens.headlineMd(scheme.onSurface),
              ),
            ),
            TextButton.icon(
              onPressed: onInvite,
              icon: Icon(Icons.person_add_alt_1_outlined,
                  size: 18, color: scheme.primary),
              label: Text(
                '초대하기',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: scheme.primary,
                ),
              ),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (members.isEmpty)
          Text(
            '등록된 책에서 멤버가 보여요. 책을 추가해 보세요.',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: scheme.onSurfaceVariant),
          )
        else
          SizedBox(
            height: 92,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: members.length,
              separatorBuilder: (_, __) => const SizedBox(width: 16),
              itemBuilder: (context, i) {
                final m = members[i];
                final initial = m.label.trim().isNotEmpty
                    ? m.label.trim().characters.first
                    : '?';
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              width: 2,
                              color: m.active
                                  ? scheme.primary
                                  : Colors.transparent,
                            ),
                          ),
                          child: CircleAvatar(
                            radius: 26,
                            backgroundColor: scheme.secondaryContainer
                                .withValues(alpha: 0.65),
                            child: Text(
                              initial,
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: m.active
                                    ? scheme.onSurface
                                    : scheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ),
                        if (m.active)
                          Positioned(
                            right: 2,
                            bottom: 2,
                            child: Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                color: const Color(0xFF22C55E),
                                shape: BoxShape.circle,
                                border:
                                    Border.all(color: scheme.surface, width: 2),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      width: 72,
                      child: Text(
                        m.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: m.active
                              ? scheme.onSurface
                              : scheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
      ],
    );
  }
}

class _MoimBookTile extends StatelessWidget {
  const _MoimBookTile({
    required this.book,
    required this.styleIndex,
    required this.onTap,
  });

  static const double _coverAspectWidthOverHeight = 2 / 3;

  final SharedLibraryBookSummary book;
  final int styleIndex;
  final VoidCallback onTap;

  /// 표지(2:3)를 그리드 셀의 가용 영역 안에 맞춘 크기. 틸트 여유를 위해 약간 축소한다.
  static Size _coverSizeForCell(double maxWidth, double maxHeight) {
    if (maxWidth <= 0 ||
        maxHeight <= 0 ||
        !maxWidth.isFinite ||
        !maxHeight.isFinite) {
      return Size.zero;
    }
    var w = maxWidth;
    var h = w / _coverAspectWidthOverHeight;
    if (h > maxHeight) {
      h = maxHeight;
      w = h * _coverAspectWidthOverHeight;
    }
    const tiltRoom = 0.94;
    return Size(w * tiltRoom, h * tiltRoom);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final cover = resolveCoverImageUrl(book.coverUrl);
    final authors = book.authors.isNotEmpty ? book.authors.join(', ') : '';
    final tilt = switch (styleIndex % 4) {
      0 => -0.035,
      1 => 0.025,
      2 => -0.02,
      _ => 0.045,
    };
    final wash = switch (styleIndex % 4) {
      0 => scheme.primary.withValues(alpha: 0.1),
      1 => scheme.tertiary.withValues(alpha: 0.08),
      2 => scheme.secondaryContainer.withValues(alpha: 0.45),
      _ => scheme.primaryContainer.withValues(alpha: 0.2),
    };

    final owners = book.owners.take(2).toList();

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final sz = _coverSizeForCell(
                    constraints.maxWidth, constraints.maxHeight);
                final ownerChips = <Widget>[];
                for (final o in owners) {
                  final name = o.displayName.trim();
                  if (name.isEmpty) continue;
                  if (ownerChips.isNotEmpty) {
                    ownerChips.add(const SizedBox(height: 4));
                  }
                  ownerChips.add(
                    ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth: math.max(0, sz.width - 8),
                      ),
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: scheme.surface.withValues(alpha: 0.92),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color:
                                scheme.outlineVariant.withValues(alpha: 0.45),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 3),
                          child: Text(
                            name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.right,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: scheme.onSurface,
                              height: 1.2,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }
                return Center(
                  child: SizedBox(
                    width: sz.width,
                    height: sz.height,
                    child: ClipRRect(
                      borderRadius:
                          BorderRadius.circular(BookfolioDesignTokens.radiusSm),
                      child: Stack(
                        fit: StackFit.expand,
                        clipBehavior: Clip.hardEdge,
                        children: [
                          Positioned.fill(
                            child: Transform.rotate(
                              angle: tilt,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  color: wash,
                                  borderRadius: BorderRadius.circular(
                                      BookfolioDesignTokens.radiusSm),
                                ),
                                child: const SizedBox.expand(),
                              ),
                            ),
                          ),
                          Positioned.fill(
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 1),
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  border: Border.all(
                                      color: BookfolioDesignTokens.ghostOutline(
                                          0.1)),
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          Colors.black.withValues(alpha: 0.12),
                                      blurRadius: 6,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: cover == null
                                    ? GradientTitlePanel(
                                        title: book.title,
                                        seedA: book.title,
                                        seedB: book.bookId,
                                      )
                                    : ColoredBox(
                                        color: scheme.surfaceContainerLow
                                            .withValues(alpha: 0.65),
                                        child: Image.network(
                                          cover,
                                          fit: BoxFit.contain,
                                          alignment: Alignment.center,
                                          width: double.infinity,
                                          height: double.infinity,
                                          headers: kCoverImageRequestHeaders,
                                          errorBuilder: (_, __, ___) =>
                                              GradientTitlePanel(
                                            title: book.title,
                                            seedA: book.title,
                                            seedB: book.bookId,
                                          ),
                                        ),
                                      ),
                              ),
                            ),
                          ),
                          if (ownerChips.isNotEmpty)
                            Positioned(
                              left: 4,
                              right: 4,
                              bottom: 4,
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: ownerChips,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 10),
          Text(
            book.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: scheme.onSurface,
                ),
          ),
          if (authors.isNotEmpty)
            Text(
              authors,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                    color: scheme.onSurfaceVariant,
                  ),
            ),
        ],
      ),
    );
  }
}

class _MoimAddBookTile extends StatelessWidget {
  const _MoimAddBookTile({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius:
                  BorderRadius.circular(BookfolioDesignTokens.radiusSm),
              child: Stack(
                clipBehavior: Clip.hardEdge,
                children: [
                  Positioned.fill(
                    child: Transform.rotate(
                      angle: 0.045,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: scheme.secondary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(
                              BookfolioDesignTokens.radiusSm),
                        ),
                        child: const SizedBox.expand(),
                      ),
                    ),
                  ),
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: scheme.surfaceContainerHigh,
                        borderRadius: BorderRadius.circular(
                            BookfolioDesignTokens.radiusSm),
                        border: Border.all(
                            color: BookfolioDesignTokens.ghostOutline(0.2)),
                      ),
                      child: Icon(
                        Icons.add_circle_outline_rounded,
                        size: 44,
                        color: scheme.onSurfaceVariant.withValues(alpha: 0.35),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            '책 추가하기',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: scheme.onSurfaceVariant,
                ),
          ),
          Text(
            '새로운 여정',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontSize: 11,
                  color: scheme.onSurfaceVariant.withValues(alpha: 0.6),
                ),
          ),
        ],
      ),
    );
  }
}

class _MoimActivityTile extends StatelessWidget {
  const _MoimActivityTile({
    required this.activity,
    required this.dotColor,
  });

  final _MoimActivity activity;
  final Color dotColor;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final bookSerif = BookfolioDesignTokens.headlineMd(scheme.onSurface,
            fontStyle: FontStyle.italic)
        .copyWith(
      fontSize: 15,
      fontWeight: FontWeight.w500,
    );
    final textStyle = Theme.of(context).textTheme.bodyMedium?.copyWith(
          height: 1.35,
          color: scheme.onSurface,
          fontSize: 14,
        );

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              activity.kind == _MoimActivityKind.memo
                  ? Text.rich(
                      TextSpan(
                        style: textStyle,
                        children: [
                          TextSpan(
                              text: activity.actor,
                              style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: scheme.primary)),
                          const TextSpan(text: '님이 문장을 공유했습니다: '),
                          TextSpan(
                              text: '"${activity.detail}"',
                              style: bookSerif.copyWith(fontSize: 14)),
                        ],
                      ),
                    )
                  : Text.rich(
                      TextSpan(
                        style: textStyle,
                        children: [
                          TextSpan(
                              text: activity.actor,
                              style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: scheme.primary)),
                          const TextSpan(text: '님이 서가에 '),
                          TextSpan(
                              text: '[${activity.bookTitle}]',
                              style: bookSerif),
                          const TextSpan(text: '을 추가했습니다.'),
                        ],
                      ),
                    ),
              const SizedBox(height: 4),
              Text(
                activity.timeLabel.toUpperCase(),
                style: BookfolioDesignTokens.labelMd(scheme.onSurfaceVariant,
                        opacity: 0.85)
                    .copyWith(fontSize: 10),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
