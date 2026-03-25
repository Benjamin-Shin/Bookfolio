import 'package:bookfolio_mobile/src/models/shared_library_models.dart';
import 'package:bookfolio_mobile/src/ui/book_ui_labels.dart';
import 'package:bookfolio_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:bookfolio_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';

/// 공동서재 한 권의 공유 서지·소유자별 상태(읽기 전용).
///
/// History:
/// - 2026-03-25: 신규
class SharedLibraryBookDetailScreen extends StatelessWidget {
  const SharedLibraryBookDetailScreen({
    super.key,
    required this.book,
    required this.libraryName,
  });

  final SharedLibraryBookSummary book;
  final String libraryName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cover = resolveCoverImageUrl(book.coverUrl);
    final metaColor = const Color(0xFF6B5B4D);
    final sectionTitleStyle = theme.textTheme.titleSmall?.copyWith(
      fontWeight: FontWeight.w700,
      color: const Color(0xFF4E4034),
    );
    final authors = book.authors.join(', ');

    return Scaffold(
      appBar: AppBar(
        title: Text(
          book.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        backgroundColor: const Color(0xFFEDE4D8),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: bookfolioMobileScrollPadding(context),
        children: [
          Text(
            libraryName,
            style: theme.textTheme.labelLarge?.copyWith(color: metaColor),
          ),
          const SizedBox(height: 12),
          if (cover != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AspectRatio(
                aspectRatio: 2 / 3,
                child: Image.network(
                  cover,
                  fit: BoxFit.cover,
                  headers: kCoverImageRequestHeaders,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
            )
          else
            Container(
              height: 180,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: const Color(0xFFE8E0D8),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                book.title,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF5C4A3A),
                ),
              ),
            ),
          const SizedBox(height: 20),
          Text(
            book.title,
            style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700, height: 1.25),
          ),
          if (authors.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(authors, style: theme.textTheme.titleMedium?.copyWith(color: metaColor)),
          ],
          const SizedBox(height: 24),
          Text('도서 정보', style: sectionTitleStyle),
          const SizedBox(height: 10),
          _InfoCard(
            children: [
              if (book.isbn != null && book.isbn!.trim().isNotEmpty)
                _InfoRow(label: 'ISBN', value: book.isbn!.trim()),
              if (book.genreSlugs != null && book.genreSlugs!.isNotEmpty)
                _InfoRow(label: '장르', value: book.genreSlugs!.join(', ')),
            ],
          ),
          const SizedBox(height: 20),
          Text('이 서재의 소유자', style: sectionTitleStyle),
          const SizedBox(height: 10),
          if (book.owners.isEmpty)
            Text(
              '연결된 소유자 정보가 없습니다.',
              style: theme.textTheme.bodyMedium?.copyWith(color: metaColor),
            )
          else
            ...book.owners.map((o) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _InfoCard(
                  children: [
                    _InfoRow(label: '이름', value: o.displayName),
                    _InfoRow(label: '읽기 상태', value: readingStatusLabelFromApi(o.readingStatus)),
                    if (o.location != null && o.location!.trim().isNotEmpty)
                      _InfoRow(label: '위치', value: o.location!.trim()),
                    if (o.memo != null && o.memo!.trim().isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('메모', style: theme.textTheme.labelLarge?.copyWith(color: metaColor)),
                            const SizedBox(height: 6),
                            Text(
                              o.memo!.trim(),
                              style: theme.textTheme.bodyMedium?.copyWith(
                                height: 1.45,
                                color: const Color(0xFF3E342C),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              );
            }),
          const SizedBox(height: 16),
          Card(
            elevation: 0,
            color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, color: theme.colorScheme.primary.withValues(alpha: 0.7)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '책 추가·읽기 상태 변경은 웹의 공동서재 화면에서 할 수 있어요.',
                      style: theme.textTheme.bodyMedium?.copyWith(color: metaColor, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: _spaced(children),
        ),
      ),
    );
  }

  static List<Widget> _spaced(List<Widget> items) {
    if (items.isEmpty) return items;
    final out = <Widget>[items.first];
    for (var i = 1; i < items.length; i++) {
      out.add(const SizedBox(height: 10));
      out.add(items[i]);
    }
    return out;
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 88,
          child: Text(
            label,
            style: theme.textTheme.labelLarge?.copyWith(color: const Color(0xFF6B5B4D)),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(color: const Color(0xFF3E342C), height: 1.35),
          ),
        ),
      ],
    );
  }
}
