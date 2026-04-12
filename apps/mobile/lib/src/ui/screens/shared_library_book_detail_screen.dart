import 'package:seogadam_mobile/src/models/shared_library_models.dart';
import 'package:seogadam_mobile/src/ui/book_ui_labels.dart';
import 'package:seogadam_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';

/// 공동서재 한 권의 공유 서지·소유자별 상태(읽기 전용).
///
/// History:
/// - 2026-04-12: 표지 — 원본(논리 픽셀)보다 크게 확대되지 않도록 상한
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
    final sectionTitleStyle = theme.textTheme.titleSmall?.copyWith(
      fontWeight: FontWeight.w700,
      color: onSurface,
    );
    final authors = book.authors.join(', ');

    return Scaffold(
      appBar: AppBar(
        title: Text(
          book.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: bookfolioMobileScrollPadding(context),
        children: [
          Text(
            libraryName,
            style: theme.textTheme.labelLarge?.copyWith(color: onSurfaceVar),
          ),
          const SizedBox(height: 12),
          if (cover != null)
            _SharedLibraryDetailCover(
              url: cover,
              borderRadius: BorderRadius.circular(12),
            )
          else
            Container(
              height: 180,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                book.title,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: onSurface,
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
            Text(authors, style: theme.textTheme.titleMedium?.copyWith(color: onSurfaceVar)),
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
              style: theme.textTheme.bodyMedium?.copyWith(color: onSurfaceVar),
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
                    if (o.memoPreview != null && o.memoPreview!.trim().isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('메모 미리보기', style: theme.textTheme.labelLarge?.copyWith(color: onSurfaceVar)),
                            const SizedBox(height: 6),
                            Text(
                              o.memoPreview!.trim(),
                              style: theme.textTheme.bodyMedium?.copyWith(
                                height: 1.45,
                                color: onSurface,
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
                      style: theme.textTheme.bodyMedium?.copyWith(color: onSurfaceVar, height: 1.4),
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
  State<_SharedLibraryDetailCover> createState() => _SharedLibraryDetailCoverState();
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

    final provider = NetworkImage(widget.url, headers: kCoverImageRequestHeaders);
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
            style: theme.textTheme.labelLarge?.copyWith(color: scheme.onSurfaceVariant),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(color: scheme.onSurface, height: 1.35),
          ),
        ),
      ],
    );
  }
}
