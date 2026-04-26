import 'package:seogadam_mobile/src/models/shared_library_models.dart';
import 'package:seogadam_mobile/src/ui/book_ui_labels.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';

/// 모임서가 한 권의 공유 서지·소유자별 상태(읽기 전용).
///
/// History:
/// - 2026-04-12: 표지 — 원본(논리 픽셀)보다 크게 확대되지 않도록 상한
/// - 2026-04-26: 내 서재 상세 톤 카드 레이아웃 + `읽는 중` 회원 목록 섹션 추가
/// - 2026-03-29: 다크 모드 — 앱바·메타/섹션/플레이스홀더·정보 카드 색을 `ColorScheme` 기준으로 통일
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
    final colorScheme = theme.colorScheme;
    final onSurface = colorScheme.onSurface;
    final onSurfaceVar = colorScheme.onSurfaceVariant;
    final cover = resolveCoverImageUrl(book.coverUrl);
    final sectionTitleStyle = theme.textTheme.titleMedium?.copyWith(
      fontWeight: FontWeight.w800,
      color: onSurface,
    );
    final authors = book.authors.join(', ');
    final readingOwners =
        book.owners.where((owner) => owner.readingStatus == 'reading').toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('도서 상세'),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: bookfolioMobileScrollPadding(context),
        children: [
          _BookSummaryCard(
            book: book,
            libraryName: libraryName,
            coverUrl: cover,
            authors: authors,
          ),
          const SizedBox(height: 18),
          Text('이 책을 읽는 회원', style: sectionTitleStyle),
          const SizedBox(height: 10),
          if (readingOwners.isEmpty)
            _InfoCard(
              children: [
                Text(
                  '아직 이 책을 읽는 중인 회원이 없습니다.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: onSurfaceVar,
                    height: 1.4,
                  ),
                ),
              ],
            )
          else
            _InfoCard(
              children: [
                Text(
                  '${readingOwners.length}명이 지금 이 책을 읽고 있어요.',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: colorScheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                ...readingOwners
                    .map((owner) => _ReadingMemberTile(owner: owner)),
              ],
            ),
          const SizedBox(height: 18),
          Text('모임서재 참여 회원', style: sectionTitleStyle),
          const SizedBox(height: 10),
          if (book.owners.isEmpty)
            Text(
              '연결된 회원 정보가 없습니다.',
              style: theme.textTheme.bodyMedium?.copyWith(color: onSurfaceVar),
            )
          else
            _InfoCard(
              children: book.owners
                  .map(
                    (owner) => _OwnerStatusRow(owner: owner),
                  )
                  .toList(),
            ),
          const SizedBox(height: 18),
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
          const SizedBox(height: 16),
          Card(
            elevation: 0,
            color: theme.colorScheme.surfaceContainerHighest
                .withValues(alpha: 0.35),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline,
                      color: theme.colorScheme.primary.withValues(alpha: 0.7)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '책 추가·읽기 상태 변경은 웹의 모임서가 화면에서 할 수 있어요.',
                      style: theme.textTheme.bodyMedium
                          ?.copyWith(color: onSurfaceVar, height: 1.4),
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

class _BookSummaryCard extends StatelessWidget {
  const _BookSummaryCard({
    required this.book,
    required this.libraryName,
    required this.coverUrl,
    required this.authors,
  });

  final SharedLibraryBookSummary book;
  final String libraryName;
  final String? coverUrl;
  final String authors;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final onSurface = scheme.onSurface;
    final onSurfaceVar = scheme.onSurfaceVariant;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.7)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 112,
            child: coverUrl != null
                ? _SharedLibraryDetailCover(
                    url: coverUrl!,
                    borderRadius: BorderRadius.circular(10),
                  )
                : Container(
                    height: 160,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: scheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      book.title,
                      maxLines: 4,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: onSurfaceVar,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  book.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                ),
                if (authors.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    authors,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: onSurfaceVar,
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _SummaryChip(label: '모임서재'),
                    _SummaryChip(label: libraryName),
                    if (book.genreSlugs != null && book.genreSlugs!.isNotEmpty)
                      _SummaryChip(label: book.genreSlugs!.first),
                  ],
                ),
                const SizedBox(height: 12),
                if (book.isbn != null && book.isbn!.trim().isNotEmpty)
                  Text(
                    'ISBN  ${book.isbn!.trim()}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: onSurfaceVar,
                    ),
                  ),
                const SizedBox(height: 8),
                Text(
                  '이 책을 함께 읽고 기록을 공유해 보세요.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: onSurface,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelSmall?.copyWith(
          color: scheme.onSurfaceVariant,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _ReadingMemberTile extends StatelessWidget {
  const _ReadingMemberTile({required this.owner});

  final SharedLibraryOwnerRow owner;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final displayName = owner.displayName.trim();
    final initial = displayName.isEmpty ? '?' : displayName[0];
    return Row(
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: scheme.primaryContainer,
          child: Text(
            initial.toUpperCase(),
            style: theme.textTheme.labelLarge?.copyWith(
              color: scheme.onPrimaryContainer,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            displayName,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: scheme.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
          decoration: BoxDecoration(
            color: scheme.secondaryContainer,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            '읽는 중',
            style: theme.textTheme.labelMedium?.copyWith(
              color: scheme.onSecondaryContainer,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

class _OwnerStatusRow extends StatelessWidget {
  const _OwnerStatusRow({required this.owner});

  final SharedLibraryOwnerRow owner;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final displayName = owner.displayName.trim();
    final initial = displayName.isEmpty ? '?' : displayName[0];
    final status = readingStatusLabelFromApi(owner.readingStatus);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: scheme.surfaceContainerHighest,
              child: Text(
                initial.toUpperCase(),
                style: theme.textTheme.labelMedium?.copyWith(
                  color: scheme.onSurface,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                displayName,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: scheme.onSurface,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                status,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: scheme.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        if (owner.location != null && owner.location!.trim().isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            '위치: ${owner.location!.trim()}',
            style: theme.textTheme.bodySmall?.copyWith(
              color: scheme.onSurfaceVariant,
            ),
          ),
        ],
        if (owner.memoPreview != null &&
            owner.memoPreview!.trim().isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            owner.memoPreview!.trim(),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodySmall?.copyWith(
              color: scheme.onSurfaceVariant,
              height: 1.35,
            ),
          ),
        ],
      ],
    );
  }
}

/// 네트워크 표지를 **원본 이미지의 논리 픽셀 크기 이하**로만 그린다(업스케일 방지).
/// 가로는 부모 `maxWidth`를 넘지 않도록 축소만 한다.
///
/// History:
/// - 2026-04-12: `ImageStreamListener`로 intrinsic 크기 측정 후 `SizedBox` 상한
class _SharedLibraryDetailCover extends StatefulWidget {
  const _SharedLibraryDetailCover({
    required this.url,
    required this.borderRadius,
  });

  final String url;
  final BorderRadius borderRadius;

  @override
  State<_SharedLibraryDetailCover> createState() =>
      _SharedLibraryDetailCoverState();
}

class _SharedLibraryDetailCoverState extends State<_SharedLibraryDetailCover> {
  ImageStream? _stream;
  ImageStreamListener? _listener;
  String? _listeningUrl;

  double? _intrinsicLogicalW;
  double? _intrinsicLogicalH;
  bool _failed = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _ensureListening();
  }

  @override
  void didUpdateWidget(covariant _SharedLibraryDetailCover oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url != widget.url) {
      _tearDownStream();
      _intrinsicLogicalW = null;
      _intrinsicLogicalH = null;
      _failed = false;
      _listeningUrl = null;
      _ensureListening();
    }
  }

  void _ensureListening() {
    if (_listeningUrl == widget.url || _failed) return;
    _tearDownStream();
    _listeningUrl = widget.url;

    final provider =
        NetworkImage(widget.url, headers: kCoverImageRequestHeaders);
    final stream = provider.resolve(createLocalImageConfiguration(context));
    _stream = stream;
    _listener = ImageStreamListener(
      _onImageFrame,
      onError: (_, __) {
        if (!mounted) return;
        setState(() {
          _failed = true;
          _intrinsicLogicalW = null;
          _intrinsicLogicalH = null;
        });
      },
    );
    stream.addListener(_listener!);
  }

  void _onImageFrame(ImageInfo info, bool _) {
    if (!mounted) return;
    final dpr = MediaQuery.devicePixelRatioOf(context);
    if (dpr <= 0) return;
    setState(() {
      _intrinsicLogicalW = info.image.width / dpr;
      _intrinsicLogicalH = info.image.height / dpr;
    });
  }

  void _tearDownStream() {
    if (_stream != null && _listener != null) {
      _stream!.removeListener(_listener!);
    }
    _stream = null;
    _listener = null;
  }

  @override
  void dispose() {
    _tearDownStream();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_failed) return const SizedBox.shrink();

    final scheme = Theme.of(context).colorScheme;

    return LayoutBuilder(
      builder: (context, constraints) {
        final maxW = constraints.maxWidth;

        if (_intrinsicLogicalW == null ||
            _intrinsicLogicalH == null ||
            _intrinsicLogicalW! <= 0 ||
            _intrinsicLogicalH! <= 0) {
          return ClipRRect(
            borderRadius: widget.borderRadius,
            child: AspectRatio(
              aspectRatio: 2 / 3,
              child: ColoredBox(
                color: scheme.surfaceContainerHighest,
                child: Center(
                  child: SizedBox(
                    width: 28,
                    height: 28,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: scheme.primary,
                    ),
                  ),
                ),
              ),
            ),
          );
        }

        final iw = _intrinsicLogicalW!;
        final ih = _intrinsicLogicalH!;
        final scale = iw <= maxW ? 1.0 : maxW / iw;
        final w = iw * scale;
        final h = ih * scale;

        return Center(
          child: ClipRRect(
            borderRadius: widget.borderRadius,
            child: SizedBox(
              width: w,
              height: h,
              child: Image.network(
                widget.url,
                fit: BoxFit.cover,
                width: w,
                height: h,
                headers: kCoverImageRequestHeaders,
                filterQuality: FilterQuality.medium,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          ),
        );
      },
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
    final scheme = theme.colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 88,
          child: Text(
            label,
            style: theme.textTheme.labelLarge
                ?.copyWith(color: scheme.onSurfaceVariant),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: theme.textTheme.bodyMedium
                ?.copyWith(color: scheme.onSurface, height: 1.35),
          ),
        ),
      ],
    );
  }
}
