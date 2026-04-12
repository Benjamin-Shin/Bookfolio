import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/book_ui_labels.dart';
import 'package:seogadam_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/barcode_scan_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/title_keyword_lookup_screen.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:seogadam_mobile/src/util/isbn.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 도서 등록·수정 폼.
///
/// History:
/// - 2026-04-12: `DropdownButtonFormField` — `value` → `initialValue`(Flutter 3.33+)
/// - 2026-04-02: 제목 메타 검색 진입을 `TitleKeywordLookupScreen`으로 분리
/// - 2026-04-02: 모바일은 종이책만 — 형식 선택을 `종이책` 고정
/// - 2026-03-29: 표지 프리뷰·섹션 카드·빠른 입력 타일·별점(스타) UI로 레이아웃 정리
/// - 2026-03-24: 제목 검색으로 메타 불러오기 버튼 추가
const _kLocationPresets = ['집', '회사', '빌려줌'];

class BookFormScreen extends StatefulWidget {
  const BookFormScreen({super.key, this.prefill, this.existingBook});

  final BookLookupResult? prefill;
  final UserBook? existingBook;

  bool get isEditing => existingBook != null;

  @override
  State<BookFormScreen> createState() => _BookFormScreenState();
}

class _BookFormScreenState extends State<BookFormScreen> {
  late final TextEditingController _isbnController;
  late final TextEditingController _titleController;
  late final TextEditingController _authorsController;
  late final TextEditingController _locationController;
  int? _rating;
  BookFormat _format = BookFormat.paper;
  ReadingStatus _status = ReadingStatus.unread;
  String? _coverUrl;
  String? _publisher;
  String? _publishedDate;
  String? _description;
  int? _priceKrw;
  bool _lookupBusy = false;

  @override
  void initState() {
    super.initState();
    final ex = widget.existingBook;
    final p = widget.prefill;
    if (ex != null) {
      _isbnController = TextEditingController(text: ex.isbn ?? '');
      _titleController = TextEditingController(text: ex.title);
      _authorsController = TextEditingController(text: ex.authors.join(', '));
      _rating = ex.rating;
      _locationController = TextEditingController(text: ex.location ?? '');
      _format = ex.format;
      _status = ex.readingStatus;
      _coverUrl = ex.coverUrl;
      _publisher = ex.publisher;
      _publishedDate = ex.publishedDate;
      _description = ex.description;
      _priceKrw = ex.priceKrw;
      _format = BookFormat.paper;
    } else {
      _isbnController = TextEditingController(text: p?.isbn ?? '');
      _titleController = TextEditingController(text: p?.title ?? '');
      _authorsController = TextEditingController(text: p?.authors.join(', ') ?? '');
      _locationController = TextEditingController();
      _coverUrl = p?.coverUrl;
      _publisher = p?.publisher;
      _publishedDate = p?.publishedDate;
      _description = p?.description;
      _priceKrw = p?.priceKrw;
    }
  }

  @override
  void dispose() {
    _isbnController.dispose();
    _titleController.dispose();
    _authorsController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  void _applyLookup(BookLookupResult lookup) {
    setState(() {
      _isbnController.text = lookup.isbn;
      _titleController.text = lookup.title;
      _authorsController.text = lookup.authors.join(', ');
      _coverUrl = lookup.coverUrl;
      _publisher = lookup.publisher;
      _publishedDate = lookup.publishedDate;
      _description = lookup.description;
      _priceKrw = lookup.priceKrw;
    });
  }

  Future<void> _openBarcodeScan() async {
    final lookup = await Navigator.of(context).push<BookLookupResult>(
      MaterialPageRoute(builder: (_) => const BarcodeScanScreen()),
    );
    if (lookup == null || !mounted) return;
    _applyLookup(lookup);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('도서 정보를 불러왔습니다.')),
    );
  }

  Future<void> _openTitleSearch() async {
    final lookup = await Navigator.of(context).push<BookLookupResult>(
      MaterialPageRoute(builder: (_) => const TitleKeywordLookupScreen()),
    );
    if (lookup == null || !mounted) return;
    _applyLookup(lookup);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('선택한 도서 정보를 반영했습니다.')),
    );
  }

  Future<void> _fetchBookMetaByIsbn() async {
    final normalized = normalizeIsbnInput(_isbnController.text);
    if (normalized == null || !isPlausibleIsbn(normalized)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('ISBN을 입력해 주세요. (10자리 또는 13자리, 하이픈은 무시됩니다)')),
      );
      return;
    }

    setState(() => _lookupBusy = true);
    try {
      final library = context.read<LibraryController>();
      final lookup = await library.lookupByIsbn(normalized);
      if (!mounted) return;
      _applyLookup(lookup);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('도서 정보를 불러왔습니다.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '도서 정보를 가져오지 못했습니다. ISBN·네트워크·서버 설정을 확인해 주세요.\n${e.toString()}',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _lookupBusy = false);
    }
  }

  Map<String, dynamic> _buildUpdatePayload() {
    final loc = _locationController.text.trim();
    return {
      'title': _titleController.text.trim(),
      'authors': _authorsController.text.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
      'format': _format.name,
      'readingStatus': _status.name,
      'rating': _rating,
      'coverUrl': _coverUrl,
      'publisher': _publisher,
      'publishedDate': _publishedDate,
      'description': _description,
      'priceKrw': _priceKrw,
      'isOwned': true,
      'location': loc.isEmpty ? null : loc,
    };
  }

  @override
  Widget build(BuildContext context) {
    final library = context.read<LibraryController>();
    final editing = widget.isEditing;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final sectionTitleStyle = theme.textTheme.titleSmall?.copyWith(
      fontWeight: FontWeight.w700,
      color: colorScheme.onSurface,
    );
    final coverResolved = resolveCoverImageUrl(_coverUrl);
    final previewTitle = _titleController.text.trim().isEmpty ? '새 책' : _titleController.text.trim();

    return Scaffold(
      appBar: AppBar(
        title: Text(editing ? '책 수정' : '책 등록'),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: bookfolioMobileScrollPadding(context),
        children: [
          _CoverPreviewHero(
            coverUrl: coverResolved,
            titleFallback: previewTitle,
          ),
          const SizedBox(height: 20),
          _FormShellCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _SectionTitleRow(
                  icon: Icons.auto_stories_outlined,
                  title: '서지 불러오기',
                  subtitle: editing ? null : 'ISBN 입력 후 조회하거나 바코드·제목으로 채울 수 있어요',
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _isbnController,
                  keyboardType: TextInputType.text,
                  textCapitalization: TextCapitalization.characters,
                  readOnly: editing,
                  decoration: InputDecoration(
                    labelText: 'ISBN',
                    hintText: editing ? null : '9788936434267',
                    border: const OutlineInputBorder(),
                    filled: true,
                    fillColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.25),
                    helperText: editing ? '수정 시 ISBN 변경은 지원하지 않아요.' : '하이픈은 자동으로 무시돼요',
                  ),
                ),
                if (!editing) ...[
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: _QuickActionTile(
                          icon: Icons.qr_code_scanner_rounded,
                          label: '바코드',
                          onTap: _lookupBusy ? null : _openBarcodeScan,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _QuickActionTile(
                          icon: Icons.manage_search_rounded,
                          label: _lookupBusy ? '조회 중' : 'ISBN 조회',
                          busy: _lookupBusy,
                          emphasized: true,
                          onTap: _lookupBusy ? null : _fetchBookMetaByIsbn,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _QuickActionTile(
                    icon: Icons.title_rounded,
                    label: '제목으로 검색',
                    onTap: _lookupBusy ? null : _openTitleSearch,
                    fullWidth: true,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 14),
          _FormShellCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _SectionTitleRow(
                  icon: Icons.edit_note_outlined,
                  title: '기본 정보',
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _titleController,
                  onChanged: (_) => setState(() {}),
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                    labelText: '제목',
                    border: const OutlineInputBorder(),
                    filled: true,
                    fillColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.25),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _authorsController,
                  textCapitalization: TextCapitalization.words,
                  decoration: InputDecoration(
                    labelText: '저자',
                    hintText: '쉼표로 구분',
                    border: const OutlineInputBorder(),
                    filled: true,
                    fillColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.25),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<BookFormat>(
                  initialValue: _format,
                  items: [
                    DropdownMenuItem(value: BookFormat.paper, child: Text(bookFormatLabelKo(BookFormat.paper))),
                  ],
                  onChanged: (value) => setState(() => _format = value ?? BookFormat.paper),
                  decoration: InputDecoration(
                    labelText: '형식(종이책만)',
                    border: const OutlineInputBorder(),
                    filled: true,
                    fillColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.25),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<ReadingStatus>(
                  initialValue: _status,
                  items: ReadingStatus.values
                      .map((status) => DropdownMenuItem(value: status, child: Text(readingStatusLabelKo(status))))
                      .toList(),
                  onChanged: (value) => setState(() => _status = value ?? ReadingStatus.unread),
                  decoration: InputDecoration(
                    labelText: '읽기 상태',
                    border: const OutlineInputBorder(),
                    filled: true,
                    fillColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.25),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          _FormShellCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('평점', style: sectionTitleStyle),
                const SizedBox(height: 6),
                Text(
                  '별을 눌러 1~5점, 같은 점수를 다시 누르면 해제돼요',
                  style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 10),
                _StarRatingRow(
                  rating: _rating,
                  onChanged: (v) => setState(() => _rating = v),
                ),
                const SizedBox(height: 18),
                Text('위치', style: sectionTitleStyle),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final label in _kLocationPresets)
                      FilterChip(
                        label: Text(label),
                        selected: _locationController.text.trim() == label,
                        showCheckmark: false,
                        onSelected: (selected) => setState(() {
                          if (selected) {
                            _locationController.text = label;
                          } else if (_locationController.text.trim() == label) {
                            _locationController.clear();
                          }
                        }),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _locationController,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    labelText: '직접 입력',
                    hintText: '서재, 친구집 등',
                    border: const OutlineInputBorder(),
                    filled: true,
                    fillColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.25),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              try {
                if (editing) {
                  await library.updateBook(widget.existingBook!.id, _buildUpdatePayload());
                } else {
                  final normalizedIsbn = normalizeIsbnInput(_isbnController.text);
                  final book = UserBook(
                    id: '',
                    bookId: '',
                    title: _titleController.text.trim(),
                    authors: _authorsController.text.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
                    format: _format,
                    readingStatus: _status,
                    rating: _rating,
                    coverUrl: _coverUrl,
                    publisher: _publisher,
                    publishedDate: _publishedDate,
                    description: _description,
                    isbn: normalizedIsbn,
                    isOwned: true,
                    priceKrw: _priceKrw,
                    location: _locationController.text.trim().isEmpty ? null : _locationController.text.trim(),
                  );
                  await library.createBook(book);
                }
                if (!context.mounted) return;
                Navigator.of(context).pop();
              } on BookfolioApiException catch (e) {
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(e.message)),
                );
              } catch (e) {
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(e.toString())),
                );
              }
            },
            icon: Icon(editing ? Icons.save_outlined : Icons.library_add_check_rounded),
            label: Text(editing ? '수정 저장' : '서재에 저장'),
          ),
        ],
      ),
    );
  }
}

class _CoverPreviewHero extends StatelessWidget {
  const _CoverPreviewHero({
    required this.coverUrl,
    required this.titleFallback,
  });

  final String? coverUrl;
  final String titleFallback;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (coverUrl != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: AspectRatio(
          aspectRatio: 2 / 3,
          child: Image.network(
            coverUrl!,
            fit: BoxFit.cover,
            headers: kCoverImageRequestHeaders,
            errorBuilder: (_, __, ___) => _CoverPlaceholder(title: titleFallback, colorScheme: colorScheme, theme: theme),
          ),
        ),
      );
    }

    return _CoverPlaceholder(title: titleFallback, colorScheme: colorScheme, theme: theme);
  }
}

class _CoverPlaceholder extends StatelessWidget {
  const _CoverPlaceholder({
    required this.title,
    required this.colorScheme,
    required this.theme,
  });

  final String title;
  final ColorScheme colorScheme;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colorScheme.primaryContainer.withValues(alpha: 0.85),
            colorScheme.surfaceContainerHighest.withValues(alpha: 0.9),
          ],
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.menu_book_rounded, size: 48, color: colorScheme.onPrimaryContainer.withValues(alpha: 0.9)),
          const SizedBox(height: 12),
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: colorScheme.onPrimaryContainer,
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }
}

class _FormShellCard extends StatelessWidget {
  const _FormShellCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
        child: child,
      ),
    );
  }
}

class _SectionTitleRow extends StatelessWidget {
  const _SectionTitleRow({
    required this.icon,
    required this.title,
    this.subtitle,
  });

  final IconData icon;
  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 22, color: colorScheme.primary),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                title,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: colorScheme.onSurface,
                ),
              ),
            ),
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
              height: 1.35,
            ),
          ),
        ],
      ],
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({
    required this.icon,
    required this.label,
    this.onTap,
    this.busy = false,
    this.emphasized = false,
    this.fullWidth = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool busy;
  final bool emphasized;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final disabled = onTap == null;

    final content = InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: fullWidth ? 16 : 10, vertical: fullWidth ? 14 : 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: emphasized ? colorScheme.primary.withValues(alpha: disabled ? 0.2 : 0.55) : colorScheme.outlineVariant,
          ),
          color: emphasized
              ? colorScheme.primaryContainer.withValues(alpha: disabled ? 0.12 : 0.35)
              : colorScheme.surface.withValues(alpha: 0.4),
        ),
        child: Row(
          mainAxisAlignment: fullWidth ? MainAxisAlignment.start : MainAxisAlignment.center,
          children: [
            if (busy)
              SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: emphasized ? colorScheme.onPrimaryContainer : colorScheme.primary,
                ),
              )
            else
              Icon(icon, size: 22, color: emphasized ? colorScheme.onPrimaryContainer : colorScheme.primary),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                label,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: emphasized ? colorScheme.onSurface : colorScheme.onSurface,
                ),
              ),
            ),
          ],
        ),
      ),
    );

    return content;
  }
}

class _StarRatingRow extends StatelessWidget {
  const _StarRatingRow({
    required this.rating,
    required this.onChanged,
  });

  final int? rating;
  final ValueChanged<int?> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        for (var i = 1; i <= 5; i++)
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
            onPressed: () => onChanged(rating == i ? null : i),
            icon: Icon(
              rating != null && i <= rating! ? Icons.star_rounded : Icons.star_border_rounded,
              size: 32,
              color: rating != null && i <= rating! ? colorScheme.primary : colorScheme.outline,
            ),
          ),
        TextButton(
          onPressed: () => onChanged(null),
          child: const Text('초기화'),
        ),
      ],
    );
  }
}
