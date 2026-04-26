import 'package:seogadam_mobile/src/models/aladin_bestseller_models.dart';
import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/book_form_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/bestseller_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/category_discovery_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/choice_new_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/discovery_book_detail_screen.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key, this.embeddedInShell = false});

  final bool embeddedInShell;

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  static const int _defaultFallbackCategoryId = 112011; // 소설
  List<AladinBestsellerItem> _bestseller = const [];
  List<AladinBestsellerItem> _itemNew = const [];
  List<AladinCategoryOption> _favoriteCategories = const [];
  List<int> _favoriteCategoryIds = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = context.read<LibraryController>().api;
      final profile = await api.fetchMeProfile();
      final preferred = profile.favoriteAladinCategoryIds.take(5).toList();
      final categoryIds = preferred.isNotEmpty
          ? preferred
          : const [_defaultFallbackCategoryId];
      Future<List<AladinBestsellerItem>> mergedByCategories(
          Future<AladinBestsellerFeed> Function(int cid) fetcher) async {
        final feeds = await Future.wait<AladinBestsellerFeed>(
          categoryIds.map(fetcher),
        );
        final seenItemIds = <String>{};
        final merged = <AladinBestsellerItem>[];
        for (final feed in feeds) {
          for (final item in feed.items) {
            final key = item.itemId.isNotEmpty
                ? item.itemId
                : '${item.isbn13}|${item.title}';
            if (seenItemIds.contains(key)) continue;
            seenItemIds.add(key);
            merged.add(item);
          }
        }
        return merged;
      }

      final results = await Future.wait<List<AladinBestsellerItem>>([
        mergedByCategories(
            (cid) => api.fetchAladinBestsellerFeed(categoryId: cid)),
        mergedByCategories(
            (cid) => api.fetchAladinItemNewFeed(categoryId: cid)),
      ]);
      final allCategories = await api.fetchAladinCategories();
      final favoriteCategories = categoryIds
          .map((cid) => allCategories.cast<AladinCategoryOption?>().firstWhere(
                (item) => item?.categoryId == cid && item?.mall == '국내도서',
                orElse: () => null,
              ))
          .whereType<AladinCategoryOption>()
          .toList();
      if (!mounted) return;
      setState(() {
        _favoriteCategoryIds = categoryIds;
        _favoriteCategories = favoriteCategories;
        _bestseller = results[0];
        _itemNew = results[1];
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
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
            priceKrw: item.priceStandard ?? item.priceSales,
            source: 'aladin',
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final preferredCategoryApplied = _favoriteCategoryIds.length != 1 ||
        _favoriteCategoryIds.first != _defaultFallbackCategoryId;
    final body = _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
            ? Center(child: Text(_error!))
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView(
                  padding: bookfolioShellTabScrollPadding(context),
                  children: [
                    TextField(
                      decoration: InputDecoration(
                        hintText: '책 제목, 저자, 출판사 검색',
                        prefixIcon: const Icon(Icons.search),
                        filled: true,
                        fillColor: scheme.surfaceContainerLowest,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                              color: BookfolioDesignTokens.ghostOutline(0.15)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                              color: BookfolioDesignTokens.ghostOutline(0.15)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _heroBanner(),
                    const SizedBox(height: 14),
                    _section(
                      title: '베스트셀러 (국내도서 관심 카테고리)',
                      onMore: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                              builder: (_) => const BestsellerScreen())),
                      items: _bestseller.take(4).toList(),
                    ),
                    const SizedBox(height: 12),
                    _section(
                      title: '초이스 신간 (국내도서 관심 카테고리)',
                      onMore: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                              builder: (_) => const ChoiceNewScreen())),
                      items: _itemNew.take(4).toList(),
                    ),
                    if (_favoriteCategoryIds.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2, bottom: 8),
                        child: Text(
                          preferredCategoryApplied
                              ? '적용 카테고리: ${_favoriteCategoryIds.length}개'
                              : '기본 카테고리 적용: 소설 (CID 112011)',
                          style: GoogleFonts.manrope(
                              fontSize: 12,
                              color: BookfolioDesignTokens.onSurfaceVariant),
                        ),
                      ),
                    const SizedBox(height: 12),
                    _recommendSection(),
                    const SizedBox(height: 12),
                    _categorySection(),
                  ],
                ),
              );

    if (widget.embeddedInShell) return body;
    return Scaffold(appBar: AppBar(title: const Text('발견')), body: body);
  }

  Widget _heroBanner() {
    return Container(
      height: 126,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [Color(0xFF0E6A3C), Color(0xFF0D4C2C)],
        ),
      ),
      padding: const EdgeInsets.fromLTRB(18, 16, 12, 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('이번 주 주목할 책',
                    style: GoogleFonts.manrope(
                        fontSize: 32 / 2,
                        fontWeight: FontWeight.w800,
                        color: Colors.white)),
                const SizedBox(height: 6),
                Text('지금 많이 읽히는 책과\n새롭게 떠오르는 책을 만나보세요.',
                    style: GoogleFonts.manrope(
                        fontSize: 12,
                        color: Colors.white.withValues(alpha: 0.92))),
              ],
            ),
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.asset('assets/brand/600_Login_Back.png',
                width: 128, height: 108, fit: BoxFit.cover),
          ),
        ],
      ),
    );
  }

  Widget _section({
    required String title,
    required VoidCallback onMore,
    required List<AladinBestsellerItem> items,
  }) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
                child: Text(title,
                    style: GoogleFonts.manrope(
                        fontSize: 28 / 2, fontWeight: FontWeight.w800))),
            TextButton(onPressed: onMore, child: const Text('더보기')),
          ],
        ),
        Row(
          children: [
            for (int i = 0; i < items.length; i++) ...[
              Expanded(child: _bookTile(items[i], items)),
              if (i != items.length - 1) const SizedBox(width: 10),
            ],
          ],
        ),
      ],
    );
  }

  Widget _bookTile(
      AladinBestsellerItem item, List<AladinBestsellerItem> relatedItems) {
    final cover = resolveCoverImageUrl(item.cover);
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => DiscoveryBookDetailScreen(
                item: item, relatedItems: relatedItems),
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
                  ? Image.network(cover,
                      fit: BoxFit.cover, headers: kCoverImageRequestHeaders)
                  : const ColoredBox(color: Color(0xFFE9E3DE)),
            ),
          ),
          const SizedBox(height: 6),
          Text(item.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.manrope(
                  fontSize: 12, fontWeight: FontWeight.w700)),
          Text(item.author,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.manrope(
                  fontSize: 11, color: BookfolioDesignTokens.onSurfaceVariant)),
          const SizedBox(height: 4),
          InkWell(
            onTap: () => _openAddFromAladin(item),
            child: Row(
              children: [
                const Icon(Icons.add_circle_outline, size: 16),
                const SizedBox(width: 4),
                Text('담기', style: GoogleFonts.manrope(fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _recommendSection() {
    final scheme = Theme.of(context).colorScheme;
    final items = [..._bestseller.take(2), ..._itemNew.take(2)];
    return Column(
      children: [
        Row(
          children: [
            Expanded(
                child: Text('나에게 맞는 책 추천',
                    style: GoogleFonts.manrope(
                        fontSize: 28 / 2, fontWeight: FontWeight.w800))),
            TextButton(onPressed: () {}, child: const Text('더보기')),
          ],
        ),
        for (final item in items)
          Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: scheme.outlineVariant),
            ),
            child: Row(
              children: [
                SizedBox(width: 34, height: 46, child: _bookTileCover(item)),
                const SizedBox(width: 10),
                Expanded(
                    child: Text(item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style:
                            GoogleFonts.manrope(fontWeight: FontWeight.w600))),
                FilledButton(
                  onPressed: () => _openAddFromAladin(item),
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(98, 34),
                    backgroundColor: const Color(0xFF0E6A3C),
                  ),
                  child: const Text('내 서가에 담기', style: TextStyle(fontSize: 11)),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _bookTileCover(AladinBestsellerItem item) {
    final scheme = Theme.of(context).colorScheme;
    final cover = resolveCoverImageUrl(item.cover);
    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: cover != null
          ? Image.network(cover,
              fit: BoxFit.cover, headers: kCoverImageRequestHeaders)
          : ColoredBox(color: scheme.surfaceContainerHigh),
    );
  }

  Widget _categorySection() {
    final scheme = Theme.of(context).colorScheme;
    final categories = _favoriteCategories;
    final preferredCategoryApplied = _favoriteCategoryIds.length != 1 ||
        _favoriteCategoryIds.first != _defaultFallbackCategoryId;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('분야별 탐색',
            style: GoogleFonts.manrope(
                fontSize: 28 / 2, fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        if (categories.isEmpty)
          Text(
            preferredCategoryApplied
                ? '내 프로필에서 관심 카테고리를 선택하면 여기에 표시됩니다.'
                : '관심 카테고리 미설정 상태라 기본 소설 카테고리를 사용 중입니다.',
            style: GoogleFonts.manrope(
              fontSize: 12,
              color: BookfolioDesignTokens.onSurfaceVariant,
            ),
          )
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final category in categories)
                InkWell(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => CategoryDiscoveryScreen(
                          categoryId: category.categoryId,
                          categoryLabel: category.depth3.isNotEmpty
                              ? category.depth3
                              : category.depth2.isNotEmpty
                                  ? category.depth2
                                  : category.depth1,
                        ),
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 150,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 10),
                    decoration: BoxDecoration(
                      color: scheme.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: scheme.outlineVariant),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.chevron_right, size: 16),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            category.depth3.isNotEmpty
                                ? category.depth3
                                : category.depth2.isNotEmpty
                                    ? category.depth2
                                    : category.depth1,
                            style: GoogleFonts.manrope(fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
      ],
    );
  }
}
