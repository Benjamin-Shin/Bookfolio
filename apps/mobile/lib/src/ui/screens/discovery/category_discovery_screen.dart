import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:seogadam_mobile/src/models/aladin_bestseller_models.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/screens/discovery/discovery_book_detail_screen.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';

class CategoryDiscoveryScreen extends StatefulWidget {
  const CategoryDiscoveryScreen({
    super.key,
    required this.categoryId,
    required this.categoryLabel,
  });

  final int categoryId;
  final String categoryLabel;

  @override
  State<CategoryDiscoveryScreen> createState() =>
      _CategoryDiscoveryScreenState();
}

class _CategoryDiscoveryScreenState extends State<CategoryDiscoveryScreen> {
  static const _maxBooks = 20;
  List<AladinBestsellerItem> _items = const [];
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
      final feed =
          await api.fetchAladinItemNewAllFeed(categoryId: widget.categoryId);
      if (!mounted) return;
      setState(() {
        _items = feed.items.take(_maxBooks).toList();
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
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.categoryLabel,
          style: GoogleFonts.manrope(fontWeight: FontWeight.w800),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    itemCount: _items.length,
                    itemBuilder: (context, index) {
                      final item = _items[index];
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
                                  '${index + 1}',
                                  style: GoogleFonts.manrope(
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0E6A3C),
                                  ),
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
                                      Text(
                                        item.title,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.manrope(
                                            fontWeight: FontWeight.w700),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        item.author,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.manrope(
                                          fontSize: 12,
                                          color: const Color(0xFF666666),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        item.publisher,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.manrope(
                                          fontSize: 12,
                                          color: const Color(0xFF666666),
                                        ),
                                      ),
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
