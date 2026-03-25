import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/ui/book_ui_labels.dart';
import 'package:bookfolio_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:bookfolio_mobile/src/ui/screens/book_form_screen.dart';
import 'package:bookfolio_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 내 서재 도서 상세(편집·삭제 포함).
///
/// History:
/// - 2026-03-25: 섹션 제목 「책 정보」→「도서 정보」
class BookDetailScreen extends StatelessWidget {
  const BookDetailScreen({super.key, required this.book});

  final UserBook book;

  UserBook _resolvedBook(LibraryController library) {
    for (final b in library.books) {
      if (b.id == book.id) return b;
    }
    return book;
  }

  Future<void> _confirmDelete(BuildContext context, UserBook target) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('이 책을 삭제할까요?'),
        content: Text('「${target.title}」을(를) 내 서재에서 제거합니다.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('취소')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('삭제'),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    await context.read<LibraryController>().deleteBook(target.id);
    if (context.mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final library = context.watch<LibraryController>();
    final b = _resolvedBook(library);
    final theme = Theme.of(context);
    final cover = resolveCoverImageUrl(b.coverUrl);
    final metaColor = const Color(0xFF6B5B4D);
    final sectionTitleStyle = theme.textTheme.titleSmall?.copyWith(
      fontWeight: FontWeight.w700,
      color: const Color(0xFF4E4034),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(
          b.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            tooltip: '수정',
            onPressed: () async {
              await Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => BookFormScreen(existingBook: b),
                ),
              );
            },
            icon: const Icon(Icons.edit_outlined),
          ),
          IconButton(
            tooltip: '삭제',
            onPressed: () => _confirmDelete(context, b),
            icon: const Icon(Icons.delete_outline),
          ),
        ],
      ),
      body: ListView(
        padding: bookfolioMobileScrollPadding(context),
        children: [
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
                b.title,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF5C4A3A),
                ),
              ),
            ),
          const SizedBox(height: 20),
          Text(b.title, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700, height: 1.25)),
          if (b.authors.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              b.authors.join(', '),
              style: theme.textTheme.titleMedium?.copyWith(color: metaColor),
            ),
          ],
          const SizedBox(height: 24),
          Text('도서 정보', style: sectionTitleStyle),
          const SizedBox(height: 10),
          _InfoCard(
            children: [
              if (b.isbn != null && b.isbn!.isNotEmpty) _InfoRow(label: 'ISBN', value: b.isbn!),
              _InfoRow(label: '형식', value: bookFormatLabelKo(b.format)),
              if (b.publisher != null && b.publisher!.isNotEmpty)
                _InfoRow(label: '출판사', value: b.publisher!),
              if (b.publishedDate != null && b.publishedDate!.isNotEmpty)
                _InfoRow(label: '출간일', value: b.publishedDate!),
              if (b.priceKrw != null) _InfoRow(label: '가격', value: '₩${b.priceKrw}'),
              if (b.description != null && b.description!.trim().isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('소개', style: theme.textTheme.labelLarge?.copyWith(color: metaColor)),
                      const SizedBox(height: 6),
                      Text(
                        b.description!.trim(),
                        style: theme.textTheme.bodyMedium?.copyWith(height: 1.45, color: const Color(0xFF3E342C)),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),
          Text('나의 기록', style: sectionTitleStyle),
          const SizedBox(height: 10),
          _InfoCard(
            children: [
              _InfoRow(label: '읽기 상태', value: readingStatusLabelKo(b.readingStatus)),
              if (b.rating != null) _InfoRow(label: '평점', value: '${b.rating} / 5'),
              if (b.location != null && b.location!.isNotEmpty)
                _InfoRow(label: '위치', value: b.location!),
              if (b.memo != null && b.memo!.trim().isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('메모', style: theme.textTheme.labelLarge?.copyWith(color: metaColor)),
                      const SizedBox(height: 6),
                      Text(
                        b.memo!.trim(),
                        style: theme.textTheme.bodyMedium?.copyWith(height: 1.45, color: const Color(0xFF3E342C)),
                      ),
                    ],
                  ),
                )
              else
                Text(
                  '메모가 없어요.',
                  style: theme.textTheme.bodyMedium?.copyWith(color: metaColor.withValues(alpha: 0.85)),
                ),
            ],
          ),
          const SizedBox(height: 20),
          Text('리뷰', style: sectionTitleStyle),
          const SizedBox(height: 10),
          Card(
            elevation: 0,
            color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.forum_outlined, color: theme.colorScheme.primary.withValues(alpha: 0.7)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '다른 사람의 리뷰·코멘트는 웹과 동일하게 곧 이 화면에서도 볼 수 있게 연결할 예정이에요.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: metaColor,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () async {
              await Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => BookFormScreen(existingBook: b),
                ),
              );
            },
            icon: const Icon(Icons.edit_outlined),
            label: const Text('정보 수정'),
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
