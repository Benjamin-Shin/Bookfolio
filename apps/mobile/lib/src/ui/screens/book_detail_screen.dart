import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/ui/book_ui_labels.dart';
import 'package:bookfolio_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:bookfolio_mobile/src/ui/screens/book_form_screen.dart';
import 'package:bookfolio_mobile/src/util/cover_image_url.dart';
import 'package:bookfolio_mobile/src/util/quote_ocr.dart';
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:provider/provider.dart';

/// 내 서재 도서 상세 — 읽기 상태·이벤트·메모·한줄평.
///
/// History:
/// - 2026-03-27: 메모 `MarkdownBody(softLineBreak: true)` — 엔터(단일 줄바꿈)가 표시에 유지됨
/// - 2026-03-26: 메모 입력 — 카메라 촬영 후 OCR로 글귀를 필드에 채우기
/// - 2026-03-26: 빈 `id`/`bookId`일 때 사이드카 API URL이 잘못 매칭되어 404 나는 문제 방지
/// - 2026-03-26: 상태/이벤트/마크다운 메모·한줄평 API 연동, `user_books.memo` 제거
/// - 2026-03-25: 섹션 제목 「책 정보」→「도서 정보」
class BookDetailScreen extends StatefulWidget {
  const BookDetailScreen({super.key, required this.book});

  final UserBook book;

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  List<UserBookMemo> _memos = [];
  List<BookOneLinerItem> _oneLiners = [];
  List<ReadingEventItem> _events = [];
  bool _loadingSidecars = true;
  String? _sidecarError;
  final _pageCtrl = TextEditingController();
  final _oneLinerCtrl = TextEditingController();
  final _newMemoCtrl = TextEditingController();
  bool _initialLoadScheduled = false;
  bool _ocrBusy = false;

  bool get _quoteOcrAvailable =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);

  @override
  void dispose() {
    _pageCtrl.dispose();
    _oneLinerCtrl.dispose();
    _newMemoCtrl.dispose();
    super.dispose();
  }

  UserBook _resolvedBook(LibraryController library) {
    for (final b in library.books) {
      if (b.id == widget.book.id) return b;
    }
    return widget.book;
  }

  BookfolioApi _api(BuildContext context) => context.read<LibraryController>().api;

  Future<void> _loadSidecars(BookfolioApi api, UserBook b) async {
    setState(() {
      _loadingSidecars = true;
      _sidecarError = null;
    });
    final userBookId = b.id.trim();
    final catalogBookId = b.bookId.trim();
    if (userBookId.isEmpty) {
      if (!mounted) return;
      setState(() {
        _sidecarError = '도서 항목 ID가 없습니다. 목록에서 다시 열어 주세요.';
        _loadingSidecars = false;
      });
      return;
    }
    try {
      final memos = await api.fetchUserBookMemos(userBookId);
      final liners =
          catalogBookId.isEmpty ? <BookOneLinerItem>[] : await api.fetchBookOneLiners(catalogBookId);
      final ev = await api.fetchReadingEvents(userBookId);
      if (!mounted) return;
      setState(() {
        _memos = memos;
        _oneLiners = liners;
        _events = ev;
        _loadingSidecars = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _sidecarError = e.toString();
        _loadingSidecars = false;
      });
    }
  }

  Future<void> _captureQuoteForMemo(BuildContext context) async {
    if (!_quoteOcrAvailable || _ocrBusy) return;
    final picker = ImagePicker();
    final shot = await picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.rear,
      imageQuality: 85,
    );
    if (shot == null || !context.mounted) return;

    setState(() => _ocrBusy = true);
    try {
      final text = await recognizeQuoteTextFromImageFile(shot.path);
      if (!context.mounted) return;
      if (text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('인식된 텍스트가 없습니다. 밝게 비춰 다시 촬영해 보세요.')),
        );
        return;
      }
      final existing = _newMemoCtrl.text.trim();
      _newMemoCtrl.text = existing.isEmpty ? text : '$existing\n\n$text';
      _newMemoCtrl.selection = TextSelection.collapsed(offset: _newMemoCtrl.text.length);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('텍스트를 메모에 넣었습니다. 필요한 부분만 남기고 저장하세요.')),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('글귀 인식 실패: $e')));
    } finally {
      if (context.mounted) setState(() => _ocrBusy = false);
    }
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

  Future<void> _setReadingStatus(BuildContext context, UserBook b, ReadingStatus s) async {
    final api = _api(context);
    final library = context.read<LibraryController>();
    try {
      await library.updateBook(b.id, {'readingStatus': s.name});
      if (!context.mounted) return;
      await _loadSidecars(api, _resolvedBook(library));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _appendEvent(
    BuildContext context,
    UserBook b,
    String type, {
    Map<String, dynamic>? payload,
    String? setReadingStatus,
  }) async {
    final api = _api(context);
    final library = context.read<LibraryController>();
    try {
      await api.appendReadingEvent(
        b.id,
        type,
        payload: payload,
        setReadingStatus: setReadingStatus,
      );
      if (!context.mounted) return;
      await library.loadBooks();
      if (!context.mounted) return;
      await _loadSidecars(api, _resolvedBook(library));
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('기록했습니다.')));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  String _eventLabel(String t) {
    switch (t) {
      case 'read_start':
        return '읽기 시작';
      case 'progress':
        return '진도';
      case 'read_pause':
        return '읽기 중지';
      case 'read_complete':
        return '완독';
      case 'dropped':
        return '하차';
      default:
        return t;
    }
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
          Text('읽기 상태', style: sectionTitleStyle),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ReadingStatus.values.map((s) {
              final selected = b.readingStatus == s;
              return FilterChip(
                label: Text(readingStatusLabelKo(s)),
                selected: selected,
                showCheckmark: false,
                onSelected: (_) => _setReadingStatus(context, b, s),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          Text('독서 이벤트', style: sectionTitleStyle),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              FilledButton.tonal(
                onPressed: () => _appendEvent(context, b, 'read_start', setReadingStatus: 'reading'),
                child: const Text('읽기 시작'),
              ),
              FilledButton.tonal(
                onPressed: () => _appendEvent(context, b, 'read_pause', setReadingStatus: 'paused'),
                child: const Text('읽기 중지'),
              ),
              FilledButton.tonal(
                onPressed: () => _appendEvent(context, b, 'read_complete', setReadingStatus: 'completed'),
                child: const Text('완독'),
              ),
              FilledButton.tonal(
                onPressed: () => _appendEvent(context, b, 'dropped', setReadingStatus: 'dropped'),
                child: const Text('하차'),
              ),
            ],
          ),
          if (b.readingStatus == ReadingStatus.reading) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _pageCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: '현재 페이지',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: () {
                    final n = int.tryParse(_pageCtrl.text.trim());
                    if (n == null || n < 1) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('페이지 번호를 입력해 주세요.')),
                      );
                      return;
                    }
                    _appendEvent(context, b, 'progress', payload: {'currentPage': n});
                    _pageCtrl.clear();
                  },
                  child: const Text('저장'),
                ),
              ],
            ),
          ],
          const SizedBox(height: 20),
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
          Text('한줄평 (공개)', style: sectionTitleStyle),
          const SizedBox(height: 8),
          TextField(
            controller: _oneLinerCtrl,
            maxLines: 2,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: '다른 사용자도 볼 수 있는 한줄평',
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              FilledButton(
                onPressed: () async {
                  final t = _oneLinerCtrl.text.trim();
                  if (t.isEmpty) return;
                  final api = _api(context);
                  try {
                    await api.upsertOneLiner(b.id, t);
                    _oneLinerCtrl.clear();
                    if (!context.mounted) return;
                    await _loadSidecars(api, b);
                  } catch (e) {
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                  }
                },
                child: const Text('저장'),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: () async {
                  final api = _api(context);
                  try {
                    await api.clearOneLiner(b.id);
                    if (!context.mounted) return;
                    await _loadSidecars(api, b);
                  } catch (e) {
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                  }
                },
                child: const Text('삭제'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_oneLiners.isEmpty)
            Text('한줄평이 없습니다.', style: theme.textTheme.bodyMedium?.copyWith(color: metaColor))
          else
            ..._oneLiners.map((o) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(o.displayName ?? '사용자'),
                    subtitle: Text(o.body),
                  ),
                )),
          const SizedBox(height: 20),
          Text('메모 (마크다운)', style: sectionTitleStyle),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: _newMemoCtrl,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    hintText: '인상 깊은 문장·느낌',
                  ),
                ),
              ),
              if (_quoteOcrAvailable) ...[
                const SizedBox(width: 4),
                _ocrBusy
                    ? Padding(
                        padding: const EdgeInsets.all(12),
                        child: SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: theme.colorScheme.primary,
                          ),
                        ),
                      )
                    : IconButton(
                        tooltip: '페이지 촬영·글귀 인식',
                        onPressed: () => _captureQuoteForMemo(context),
                        icon: const Icon(Icons.photo_camera_outlined),
                      ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          FilledButton.tonal(
            onPressed: () async {
              final md = _newMemoCtrl.text.trim();
              if (md.isEmpty) return;
              final api = _api(context);
              try {
                await api.createUserBookMemo(b.id, md);
                _newMemoCtrl.clear();
                if (!context.mounted) return;
                await _loadSidecars(api, b);
              } catch (e) {
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
              }
            },
            child: const Text('메모 추가'),
          ),
          const SizedBox(height: 12),
          if (_memos.isEmpty)
            Text('메모가 없습니다.', style: theme.textTheme.bodyMedium?.copyWith(color: metaColor))
          else
            ..._memos.map((m) => Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: MarkdownBody(
                      data: m.bodyMd,
                      selectable: true,
                      softLineBreak: true,
                    ),
                  ),
                )),
          const SizedBox(height: 20),
          Text('이벤트 타임라인 (나만)', style: sectionTitleStyle),
          const SizedBox(height: 8),
          if (_sidecarError != null)
            Text(_sidecarError!, style: TextStyle(color: theme.colorScheme.error, fontSize: 13)),
          if (_loadingSidecars)
            const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
          else if (_events.isEmpty)
            Text(
              '기록이 없습니다.',
              style: theme.textTheme.bodyMedium?.copyWith(color: metaColor),
            )
          else
            ..._events.take(30).map((e) => ListTile(
                  dense: true,
                  title: Text(_eventLabel(e.eventType)),
                  subtitle: Text(
                    '${e.occurredAt}${e.payload.isEmpty ? '' : ' · ${e.payload}'}',
                    style: const TextStyle(fontSize: 12),
                  ),
                )),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () async {
              await Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => BookFormScreen(existingBook: b),
                ),
              );
            },
            icon: const Icon(Icons.edit_outlined),
            label: const Text('도서 메타 수정'),
          ),
        ],
      ),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialLoadScheduled) return;
    _initialLoadScheduled = true;
    final lib = context.read<LibraryController>();
    final b = _resolvedBook(lib);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _loadSidecars(context.read<LibraryController>().api, b);
    });
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
