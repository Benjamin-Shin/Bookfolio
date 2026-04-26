import 'package:seogadam_mobile/src/models/aladin_bestseller_models.dart';
import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/models/shared_library_models.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/bestseller_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/library/book_detail_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/book_form_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/choice_new_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/discovery_book_detail_screen.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

/// 로그인 후 홈 화면(`Home.png`) 기준 재구축 버전.
///
/// History:
/// - 2026-04-25: 기존 홈 전면 교체 — 히어로/이어읽기/바로가기/발견/내 모임서가/하단 CTA 구조
class BookfolioHomeScreen extends StatefulWidget {
  const BookfolioHomeScreen({
    super.key,
    required this.refreshSignal,
    required this.onOpenSharedLibraries,
    required this.onOpenMyLibrary,
    required this.onOpenStats,
  });

  final int refreshSignal;
  final VoidCallback onOpenSharedLibraries;
  final VoidCallback onOpenMyLibrary;
  final VoidCallback onOpenStats;

  @override
  State<BookfolioHomeScreen> createState() => _BookfolioHomeScreenState();
}

enum _DiscoverTab { bestseller, itemNew }

class _BookfolioHomeScreenState extends State<BookfolioHomeScreen> {
  MeAppProfile? _profile;
  PersonalLibrarySummary? _summary;
  UserBook? _readingBook;
  List<SharedLibrarySummary> _libraries = const [];
  List<AladinBestsellerItem> _bestseller = const [];
  List<AladinBestsellerItem> _itemNew = const [];
  bool _loading = true;
  String? _error;
  _DiscoverTab _discoverTab = _DiscoverTab.bestseller;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void didUpdateWidget(covariant BookfolioHomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.refreshSignal != widget.refreshSignal) {
      _load();
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final api = context.read<LibraryController>().api;
      final results = await Future.wait([
        api.fetchMobileHome(),
        api.fetchAladinBestsellerFeed(),
        api.fetchAladinItemNewFeed(),
        api.fetchSharedLibraries(),
      ]);
      if (!mounted) return;
      final home = results[0] as MobileHomeBundle;
      setState(() {
        _profile = home.profile;
        _summary = home.personalLibrarySummary;
        _readingBook = home.readingBook;
        _bestseller = (results[1] as AladinBestsellerFeed).items;
        _itemNew = (results[2] as AladinBestsellerFeed).items;
        _libraries = results[3] as List<SharedLibrarySummary>;
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

  String _displayName() {
    final p = _profile;
    if (p == null) return '회원';
    final n = (p.displayName ?? '').trim();
    if (n.isNotEmpty) return n;
    final e = p.email.trim();
    if (e.contains('@')) return e.split('@').first;
    return e.isEmpty ? '회원' : e;
  }

  String _readingStatusLabel(ReadingStatus s) {
    switch (s) {
      case ReadingStatus.unread:
        return '읽고 싶은 책';
      case ReadingStatus.reading:
        return '읽는 중';
      case ReadingStatus.completed:
        return '읽은 책';
      case ReadingStatus.paused:
        return '보류';
      case ReadingStatus.dropped:
        return '중단';
    }
  }

  Future<void> _openAddFromAladin(AladinBestsellerItem item) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => BookFormScreen(
          prefill: BookLookupResult(
            isbn: item.isbn13.isNotEmpty ? item.isbn13 : item.isbn,
            title: item.title,
            authors: item.author.isEmpty ? const [] : [item.author],
            publisher: item.publisher.isEmpty ? null : item.publisher,
            publishedDate: item.pubDate.isEmpty ? null : item.pubDate,
            coverUrl: item.cover.isEmpty ? null : item.cover,
            description: null,
            priceKrw: item.priceSales,
            source: 'aladin',
          ),
        ),
      ),
    );
    if (!mounted) return;
    await context.read<LibraryController>().loadBooks();
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final discoverItems =
        (_discoverTab == _DiscoverTab.bestseller ? _bestseller : _itemNew)
            .take(4)
            .toList();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: bookfolioShellTabScrollPadding(context),
        children: [
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(child: CircularProgressIndicator()),
            )
          else ...[
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  _error!,
                  style: TextStyle(color: scheme.error),
                ),
              ),
            _heroSection(),
            const SizedBox(height: 14),
            _continueReadingSection(),
            const SizedBox(height: 14),
            _quickMenuSection(),
            const SizedBox(height: 18),
            _discoverSection(discoverItems),
            const SizedBox(height: 24),
            _myLibrariesSection(),
            const SizedBox(height: 10),
            _statsCta(),
          ],
        ],
      ),
    );
  }

  Widget _heroSection() {
    final s = _summary;
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [Color(0xFF0E6A3C), Color(0xFF0D4C2C)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_displayName()}님의 서가',
                    style: GoogleFonts.manrope(
                      fontSize: 34 / 2,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '이번 달 ${s?.readCompleteThisMonthCount ?? 0}권 읽음  ·  올해 ${s?.readCompleteThisYearCount ?? 0}권 등록',
                    style: GoogleFonts.manrope(
                      fontSize: 12,
                      color: Colors.white.withValues(alpha: 0.92),
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: widget.onOpenMyLibrary,
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white.withValues(alpha: 0.18),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 8),
                    ),
                    child: const Text('내 서가 보기'),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.asset(
                'assets/brand/600_Login_Back.png',
                width: 126,
                height: 110,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _continueReadingSection() {
    final b = _readingBook;
    if (b == null) {
      return _surfaceCard(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const Icon(Icons.menu_book_outlined),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  '이어 읽을 책이 없습니다. 내 서가에서 책 상태를 "읽는 중"으로 설정해 보세요.',
                  style: BookfolioDesignTokens.bodyLg(
                      BookfolioDesignTokens.onSurfaceVariant),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final total = b.effectiveTotalPages;
    final current = b.currentPage ?? 0;
    final progress = total != null && total > 0
        ? (current / total).clamp(0.0, 1.0)
        : 0.0;
    final cover = resolveCoverImageUrl(b.coverUrl);
    return _surfaceCard(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '이어 읽기',
                    style: GoogleFonts.manrope(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: BookfolioDesignTokens.onSurface,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                        builder: (_) => BookDetailScreen(book: b)),
                  ),
                  icon: const Icon(Icons.chevron_right_rounded),
                ),
              ],
            ),
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: SizedBox(
                    width: 84,
                    height: 116,
                    child: cover != null
                        ? Image.network(
                            cover,
                            fit: BoxFit.cover,
                            headers: kCoverImageRequestHeaders,
                            errorBuilder: (_, __, ___) =>
                                _coverPlaceholder(84, 116),
                          )
                        : _coverPlaceholder(84, 116),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        b.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.manrope(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        b.authors.isEmpty ? '저자 미상' : b.authors.join(', '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.manrope(
                          fontSize: 13,
                          color: BookfolioDesignTokens.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        total != null && total > 0
                            ? '$current / $total쪽'
                            : _readingStatusLabel(b.readingStatus),
                        style: GoogleFonts.manrope(
                          fontSize: 21,
                          fontWeight: FontWeight.w700,
                          color: BookfolioDesignTokens.primary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: progress,
                        minHeight: 8,
                        borderRadius: BorderRadius.circular(999),
                        backgroundColor:
                            BookfolioDesignTokens.surfaceContainerHigh,
                        color: BookfolioDesignTokens.primary,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Text(
                            '${(progress * 100).round()}%',
                            style: GoogleFonts.manrope(
                              fontSize: 12,
                              color: BookfolioDesignTokens.onSurfaceVariant,
                            ),
                          ),
                          const Spacer(),
                          FilledButton(
                            onPressed: () => Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => BookDetailScreen(book: b),
                              ),
                            ),
                            style: FilledButton.styleFrom(
                              backgroundColor: BookfolioDesignTokens.primary,
                              foregroundColor: Colors.white,
                              minimumSize: const Size(96, 36),
                            ),
                            child: const Text('계속 읽기'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickMenuSection() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _quickMenuTile(
                icon: Icons.local_library_rounded,
                title: '내 서가',
                subtitle: '전체 ${_summary?.ownedWorkCount ?? 0}권',
                onTap: widget.onOpenMyLibrary,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _quickMenuTile(
                icon: Icons.groups_2_rounded,
                title: '모임서가',
                subtitle: '참여 ${_libraries.length}개',
                onTap: widget.onOpenSharedLibraries,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _quickMenuTile(
                icon: Icons.emoji_events_rounded,
                title: '베스트셀러',
                subtitle: '이번 주 인기 도서',
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const BestsellerScreen(),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _quickMenuTile(
                icon: Icons.auto_stories_rounded,
                title: '신간',
                subtitle: '새로 나온 책',
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const ChoiceNewScreen(),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _discoverSection(List<AladinBestsellerItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                '발견',
                style: GoogleFonts.manrope(
                  fontSize: 27 / 2,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            InkWell(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => _discoverTab == _DiscoverTab.bestseller
                        ? const BestsellerScreen()
                        : const ChoiceNewScreen(),
                  ),
                );
              },
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Text(
                  '더보기',
                  style: GoogleFonts.manrope(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: BookfolioDesignTokens.onSurfaceVariant,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _pillTab(
              label: '베스트셀러',
              selected: _discoverTab == _DiscoverTab.bestseller,
              onTap: () => setState(() => _discoverTab = _DiscoverTab.bestseller),
            ),
            const SizedBox(width: 8),
            _pillTab(
              label: '신간',
              selected: _discoverTab == _DiscoverTab.itemNew,
              onTap: () => setState(() => _discoverTab = _DiscoverTab.itemNew),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (items.isEmpty)
          Text(
            '표시할 도서가 없습니다.',
            style:
                BookfolioDesignTokens.bodyLg(BookfolioDesignTokens.onSurfaceVariant),
          )
        else
          LayoutBuilder(
            builder: (context, constraints) {
              final visibleItems = items.take(4).toList();
              if (visibleItems.isEmpty) return const SizedBox.shrink();
              const gap = 10.0;
              final tileWidth =
                  (constraints.maxWidth - (gap * (visibleItems.length - 1))) /
                      visibleItems.length;
              return Row(
                children: [
                  for (int i = 0; i < visibleItems.length; i++) ...[
                    SizedBox(
                      width: tileWidth,
                      child: _discoverBookTile(visibleItems[i]),
                    ),
                    if (i != visibleItems.length - 1) const SizedBox(width: gap),
                  ],
                ],
              );
            },
          ),
      ],
    );
  }

  Widget _discoverBookTile(AladinBestsellerItem item) {
    final cover = resolveCoverImageUrl(item.cover);
    final list = _discoverTab == _DiscoverTab.bestseller ? _bestseller : _itemNew;
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => DiscoveryBookDetailScreen(
              item: item,
              relatedItems: list,
            ),
          ),
        );
      },
      borderRadius: BorderRadius.circular(8),
      child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: AspectRatio(
            aspectRatio: 0.72,
            child: cover != null
                ? Image.network(
                    cover,
                    fit: BoxFit.cover,
                    headers: kCoverImageRequestHeaders,
                    errorBuilder: (_, __, ___) => _coverPlaceholder(0, 0),
                  )
                : _coverPlaceholder(0, 0),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          item.title,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.manrope(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            height: 1.25,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          item.author,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.manrope(
            fontSize: 11,
            color: BookfolioDesignTokens.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 4),
        InkWell(
          onTap: () => _openAddFromAladin(item),
          child: Row(
            children: [
              const Icon(Icons.add_circle_outline, size: 16),
              const SizedBox(width: 4),
              Text(
                '담기',
                style: GoogleFonts.manrope(fontSize: 12),
              ),
            ],
          ),
        ),
      ],
      ),
    );
  }

  Widget _myLibrariesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                '내 모임서가',
                style: GoogleFonts.manrope(
                  fontSize: 27 / 2,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            TextButton(
              onPressed: widget.onOpenSharedLibraries,
              child: const Text('더보기'),
            ),
          ],
        ),
        const SizedBox(height: 4),
        if (_libraries.isEmpty)
          _surfaceCard(
            child: ListTile(
              leading: const Icon(Icons.groups_outlined),
              title: const Text('참여 중인 모임이 없습니다'),
              subtitle: const Text('모임서가에서 새 모임을 만들거나 참여해 보세요.'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: widget.onOpenSharedLibraries,
            ),
          )
        else
          ..._libraries.take(2).map((lib) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _surfaceCard(
                child: ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  title: Text(
                    lib.name,
                    style: GoogleFonts.manrope(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  subtitle: Text(
                    (lib.description ?? '').trim().isEmpty
                        ? '${lib.kindLabel} 모임'
                        : lib.description!.trim(),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: BookfolioDesignTokens.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      lib.myRole == 'owner' ? '운영 중' : '참여 중',
                      style: GoogleFonts.manrope(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: BookfolioDesignTokens.primary,
                      ),
                    ),
                  ),
                  onTap: widget.onOpenSharedLibraries,
                ),
              ),
            );
          }),
      ],
    );
  }

  Widget _statsCta() {
    return FilledButton.icon(
      onPressed: widget.onOpenStats,
      style: FilledButton.styleFrom(
        backgroundColor: BookfolioDesignTokens.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(44),
      ),
      icon: const Icon(Icons.bar_chart_rounded, size: 18),
      label: const Text('내 서가 통계보기'),
    );
  }

  Widget _quickMenuTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return _surfaceCard(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Row(
            children: [
              Icon(icon, color: BookfolioDesignTokens.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.manrope(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: GoogleFonts.manrope(
                        fontSize: 11,
                        color: BookfolioDesignTokens.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, size: 18),
            ],
          ),
        ),
      ),
    );
  }

  Widget _pillTab({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected
              ? BookfolioDesignTokens.primary
              : BookfolioDesignTokens.surfaceContainerLow,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: GoogleFonts.manrope(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: selected ? Colors.white : BookfolioDesignTokens.onSurface,
          ),
        ),
      ),
    );
  }

  Widget _surfaceCard({required Widget child}) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: BookfolioDesignTokens.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: BookfolioDesignTokens.ghostOutline(0.15)),
      ),
      child: child,
    );
  }

  Widget _coverPlaceholder(double width, double height) {
    return Container(
      width: width <= 0 ? null : width,
      height: height <= 0 ? null : height,
      color: BookfolioDesignTokens.surfaceContainerHigh,
      alignment: Alignment.center,
      child: Icon(
        Icons.menu_book_rounded,
        color: BookfolioDesignTokens.onSurfaceVariant.withValues(alpha: 0.5),
      ),
    );
  }
}
