import 'package:seogadam_mobile/src/models/aladin_bestseller_models.dart';
import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/ui/screens/book_form_screen.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

class DiscoveryBookDetailScreen extends StatelessWidget {
  const DiscoveryBookDetailScreen({
    super.key,
    required this.item,
    this.relatedItems = const [],
  });

  final AladinBestsellerItem item;
  final List<AladinBestsellerItem> relatedItems;

  Future<void> _openExternalLink() async {
    final uri = Uri.tryParse(item.link.trim());
    if (uri == null || !uri.hasScheme) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _openAddBook(BuildContext context) async {
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
    final cover = resolveCoverImageUrl(item.cover);
    final related =
        relatedItems.where((e) => e.itemId != item.itemId).take(3).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          '도서 상세',
          style: GoogleFonts.manrope(fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE9E3DE)),
            ),
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: SizedBox(
                    width: 120,
                    height: 170,
                    child: cover != null
                        ? Image.network(cover, fit: BoxFit.cover)
                        : const ColoredBox(color: Color(0xFFE9E3DE)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: GoogleFonts.manrope(
                          fontSize: 28 / 2,
                          fontWeight: FontWeight.w800,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(item.author,
                          style: GoogleFonts.manrope(fontSize: 12)),
                      const SizedBox(height: 4),
                      Text(item.publisher,
                          style: GoogleFonts.manrope(fontSize: 12)),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          _metaChip(
                              '출간일  ${item.pubDate.isEmpty ? '-' : item.pubDate}'),
                          _metaChip(
                              'ISBN  ${item.isbn13.isNotEmpty ? item.isbn13 : item.isbn}'),
                          _metaChip(
                              '카테고리  ${item.categoryName.isEmpty ? '-' : item.categoryName}'),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        '가격  ${(item.priceStandard ?? item.priceSales)?.toString() ?? '-'}원',
                        style: GoogleFonts.manrope(
                            fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text('구매 및 담기',
              style: GoogleFonts.manrope(
                  fontSize: 28 / 2, fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          FilledButton.icon(
            onPressed: () => _openAddBook(context),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              backgroundColor: const Color(0xFF0E6A3C),
            ),
            icon: const Icon(Icons.add, size: 20),
            label: const Text('내 서가에 담기'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: _openExternalLink,
            style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(46)),
            child: const Text('알라딘에서 보기'),
          ),
          // const SizedBox(height: 10),
          // OutlinedButton(
          //   onPressed: _openExternalLink,
          //   style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(46)),
          //   child: const Text('교보문고에서 보기'),
          // ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Text(
                  '이런 책도 좋아할 수 있어요',
                  style: GoogleFonts.manrope(
                      fontSize: 28 / 2, fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (related.isEmpty)
            Text('추천 도서가 없습니다.', style: GoogleFonts.manrope(fontSize: 12))
          else
            Row(
              children: [
                for (int i = 0; i < related.length; i++) ...[
                  Expanded(child: _relatedTile(context, related[i])),
                  if (i != related.length - 1) const SizedBox(width: 8),
                ],
              ],
            ),
        ],
      ),
    );
  }

  Widget _relatedTile(BuildContext context, AladinBestsellerItem related) {
    final cover = resolveCoverImageUrl(related.cover);
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => DiscoveryBookDetailScreen(
                item: related, relatedItems: relatedItems),
          ),
        );
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFE9E3DE)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 0.72,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: cover != null
                    ? Image.network(cover, fit: BoxFit.cover)
                    : const ColoredBox(color: Color(0xFFE9E3DE)),
              ),
            ),
            const SizedBox(height: 6),
            Text(related.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.manrope(
                    fontSize: 11, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.add_circle_outline, size: 14),
                const SizedBox(width: 4),
                Text('담기', style: GoogleFonts.manrope(fontSize: 11)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _metaChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F2EF),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label, style: GoogleFonts.manrope(fontSize: 11)),
    );
  }
}
