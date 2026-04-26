import 'package:seogadam_mobile/src/models/aladin_bestseller_models.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/discovery_book_detail_screen.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class ChoiceNewScreen extends StatefulWidget {
  const ChoiceNewScreen({super.key});

  @override
  State<ChoiceNewScreen> createState() => _ChoiceNewScreenState();
}

class _ChoiceNewScreenState extends State<ChoiceNewScreen> {
  static const int _defaultFallbackCategoryId = 112011; // 소설
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
        categoryIds.map((cid) => api.fetchAladinItemNewFeed(categoryId: cid)),
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

  @override
  Widget build(BuildContext context) {
    final preferredCategoryApplied = _favoriteCategoryIds.length != 1 ||
        _favoriteCategoryIds.first != _defaultFallbackCategoryId;
    return Scaffold(
      appBar: AppBar(
        title: Text('초이스 신간',
            style: GoogleFonts.manrope(fontWeight: FontWeight.w800)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    itemCount: _items.length + 1,
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
                              border:
                                  Border.all(color: const Color(0xFFE9E3DE)),
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
                                        ? Image.network(cover,
                                            fit: BoxFit.cover)
                                        : const ColoredBox(
                                            color: Color(0xFFE9E3DE)),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
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
                ),
    );
  }
}
