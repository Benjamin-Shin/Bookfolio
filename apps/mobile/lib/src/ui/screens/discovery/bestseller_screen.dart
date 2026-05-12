import 'package:seogadam_mobile/src/models/aladin_bestseller_models.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/discovery_book_detail_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/discovery_flow_breadcrumb.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

/// 알라딘 베스트셀러 목록.
///
/// History:
/// - 2026-05-12: `embeddedInShell` — 메인 쉘 상·하단 유지, 본문 상단 브레드크럼
class BestsellerScreen extends StatefulWidget {
  const BestsellerScreen({super.key, this.embeddedInShell = false});

  /// `true`이면 [Scaffold]/자체 앱바 없이 본문만( [MainShellScreen] 위 푸시).
  final bool embeddedInShell;

  @override
  State<BestsellerScreen> createState() => _BestsellerScreenState();
}

class _BestsellerScreenState extends State<BestsellerScreen> {
  static const int _defaultFallbackCategoryId = 112011; // 소설
  static const String _breadcrumbLeaf = '베스트 셀러';
  List<AladinBestsellerItem> _items = const [];
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
      final feeds = await Future.wait<AladinBestsellerFeed>(
        categoryIds
            .map((cid) => api.fetchAladinBestsellerFeed(categoryId: cid)),
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
      if (!mounted) return;
      setState(() {
        _favoriteCategoryIds = categoryIds;
        _items = merged;
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

  EdgeInsets _listPadding(BuildContext context) {
    if (widget.embeddedInShell) {
      return bookfolioShellTabScrollPadding(context).copyWith(top: 4);
    }
    final b = MediaQuery.viewPaddingOf(context).bottom;
    return EdgeInsets.fromLTRB(16, 8, 16, 24 + b);
  }

  Widget _breadcrumbPadded() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: const DiscoveryFlowBreadcrumb(leafLabel: _breadcrumbLeaf),
    );
  }

  Widget _buildBody(BuildContext context) {
    final preferredCategoryApplied = _favoriteCategoryIds.length != 1 ||
        _favoriteCategoryIds.first != _defaultFallbackCategoryId;
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(child: Text(_error!));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: _listPadding(context),
        itemCount: _items.length + 1,
        physics: widget.embeddedInShell
            ? const AlwaysScrollableScrollPhysics()
            : null,
        itemBuilder: (context, index) {
          if (index == 0) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                preferredCategoryApplied
                    ? '국내도서 관심 카테고리 ${_favoriteCategoryIds.length}개 기준'
                    : '국내도서 기본 카테고리: 소설(CID 112011) 기준',
                style: GoogleFonts.manrope(
                    fontSize: 12, color: const Color(0xFF666666)),
              ),
            );
          }
          final item = _items[index - 1];
          final cover = resolveCoverImageUrl(item.cover);
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: InkWell(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => DiscoveryBookDetailScreen(
                      item: item,
                      relatedItems: _items,
                    ),
                  ),
                );
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE9E3DE)),
                ),
                child: Row(
                  children: [
                    Text(
                      '$index',
                      style: GoogleFonts.manrope(
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0E6A3C)),
                    ),
                    const SizedBox(width: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: SizedBox(
                        width: 62,
                        height: 90,
                        child: cover != null
                            ? Image.network(cover, fit: BoxFit.cover)
                            : const ColoredBox(color: Color(0xFFE9E3DE)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.title,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.manrope(
                                  fontWeight: FontWeight.w700)),
                          const SizedBox(height: 4),
                          Text(item.author,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.manrope(
                                  fontSize: 12,
                                  color: const Color(0xFF666666))),
                          const SizedBox(height: 4),
                          Text(item.publisher,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.manrope(
                                  fontSize: 12,
                                  color: const Color(0xFF666666))),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final body = _buildBody(context);
    if (widget.embeddedInShell) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _breadcrumbPadded(),
          Expanded(child: body),
        ],
      );
    }
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        title: const DiscoveryFlowBreadcrumb(leafLabel: _breadcrumbLeaf),
      ),
      body: body,
    );
  }
}
