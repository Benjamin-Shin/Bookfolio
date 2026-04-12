import 'dart:async';

import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/book_ui_labels.dart';
import 'package:seogadam_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:seogadam_mobile/src/util/quote_ocr.dart';
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

List<Widget> _detailSectionSpacedWidgets(List<Widget> items) {
  if (items.isEmpty) return items;
  final out = <Widget>[items.first];
  for (var i = 1; i < items.length; i++) {
    out.add(const SizedBox(height: 10));
    out.add(items[i]);
  }
  return out;
}

/// 상세 화면 본문 구역 — 제목 + 내용을 한 카드로 묶음.
class _DetailSection extends StatelessWidget {
  const _DetailSection({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Card(
      elevation: 0,
      color: scheme.surfaceContainerHighest.withValues(alpha: 0.35),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              title,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: scheme.onSurface,
              ),
            ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

/// 내 서재 도서 상세 — 읽기 상태·이벤트·메모·한줄평.
///
/// History:
/// - 2026-04-06: `user_books` 현재/총 쪽 저장·타임라인 진행 입력 분리
/// - 2026-04-03: 웹·비모바일 — `speech_to_text` 초기화 생략(`MissingPluginException` 방지)
/// - 2026-04-02: 커버 축소·제목/저자 우측, 내 평점·위치 편집, 회원 평균 표시, 메모 시각·STT, 이벤트 로케일, 메타 편집 제거, `LibraryController.bookForDetail`
/// - 2026-03-29: 본문 블록을 `_DetailSection` 카드로 구역화(읽기 상태·이벤트·도서 정보·한줄평·메모·타임라인)
/// - 2026-03-29: 다크 모드 — 메타·섹션·플레이스홀더·도서 소개·정보 행·메모 마크다운 `ColorScheme`·`MarkdownStyleSheet.fromTheme` 연동
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
  final _eventProgressPageCtrl = TextEditingController();
  final _persistCurrentPageCtrl = TextEditingController();
  final _persistTotalPagesCtrl = TextEditingController();
  final _oneLinerCtrl = TextEditingController();
  final _newMemoCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _speechUsable = false;
  bool _speechListening = false;
  bool _initialLoadScheduled = false;
  bool _ocrBusy = false;
  String? _lastDetailIdForLocation;
  String? _lastDetailIdForReadingProgress;
  Timer? _speechCap;

  bool get _quoteOcrAvailable =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);

  /// `speech_to_text`는 Flutter 웹 등에 네이티브 구현이 없어 `initialize` 시 예외가 납니다.
  bool get _speechToTextPluginAvailable =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);

  @override
  void dispose() {
    _speechCap?.cancel();
    _eventProgressPageCtrl.dispose();
    _persistCurrentPageCtrl.dispose();
    _persistTotalPagesCtrl.dispose();
    _oneLinerCtrl.dispose();
    _newMemoCtrl.dispose();
    _locationCtrl.dispose();
    super.dispose();
  }

  UserBook _displayBook(LibraryController library) => library.bookForDetail(widget.book);

  BookfolioApi _api(BuildContext context) => context.read<LibraryController>().api;

  Future<void> _initSpeech() async {
    if (!_speechToTextPluginAvailable) return;
    try {
      final ok = await _speech.initialize(
        onStatus: (s) {
          if (s == 'done' || s == 'notListening') {
            if (mounted) setState(() => _speechListening = false);
          }
        },
        onError: (_) {},
      );
      if (mounted) setState(() => _speechUsable = ok);
    } catch (_) {
      if (mounted) setState(() => _speechUsable = false);
    }
  }

  Future<void> _dictateMemo() async {
    if (!_speechUsable || _speechListening) return;
    final localeId = Localizations.localeOf(context).toLanguageTag();
    setState(() => _speechListening = true);
    _speechCap?.cancel();
    _speechCap = Timer(const Duration(seconds: 30), () async {
      await _speech.stop();
      if (mounted) setState(() => _speechListening = false);
    });
    await _speech.listen(
      onResult: (r) {
        if (r.finalResult && r.recognizedWords.trim().isNotEmpty) {
          final t = r.recognizedWords.trim();
          final cur = _newMemoCtrl.text.trim();
          _newMemoCtrl.text = cur.isEmpty ? t : '$cur\n$t';
          _newMemoCtrl.selection = TextSelection.collapsed(offset: _newMemoCtrl.text.length);
        }
      },
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 4),
      localeId: localeId,
    );
  }

  void _syncLocationField(UserBook b) {
    if (_lastDetailIdForLocation != b.id) {
      _lastDetailIdForLocation = b.id;
      _locationCtrl.text = b.location ?? '';
    }
  }

  void _syncReadingProgressFields(UserBook b) {
    if (_lastDetailIdForReadingProgress != b.id) {
      _lastDetailIdForReadingProgress = b.id;
      _persistCurrentPageCtrl.text = b.currentPage != null ? '${b.currentPage}' : '';
      _persistTotalPagesCtrl.text = b.readingTotalPages != null ? '${b.readingTotalPages}' : '';
      _eventProgressPageCtrl.clear();
    }
  }

  Future<void> _saveReadingProgress(BuildContext context, UserBook b) async {
    int? cur;
    final curRaw = _persistCurrentPageCtrl.text.trim();
    if (curRaw.isEmpty) {
      cur = null;
    } else {
      final n = int.tryParse(curRaw);
      if (n == null || n < 0) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('현재 쪽은 0 이상 정수로 입력하거나 비워 주세요.')));
        }
        return;
      }
      cur = n > 50000 ? 50000 : n;
    }
    int? tot;
    final totRaw = _persistTotalPagesCtrl.text.trim();
    if (totRaw.isEmpty) {
      tot = null;
    } else {
      final n = int.tryParse(totRaw);
      if (n == null || n < 1) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('총 쪽은 1 이상이거나 비워야 합니다.')));
        }
        return;
      }
      tot = n > 50000 ? 50000 : n;
    }
    if (cur != null && tot != null && cur > tot) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('현재 쪽이 총 쪽보다 클 수 없습니다.')));
      }
      return;
    }
    final eff = b.effectiveTotalPages;
    if (cur != null && eff != null && cur > eff && tot == null) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('서지 기준 총 $eff쪽을 넘깁니다. 총 쪽을 재정의하거나 값을 줄여 주세요.')),
        );
      }
      return;
    }
    try {
      final updated = await context.read<LibraryController>().updateBook(b.id, {
        'currentPage': cur,
        'readingTotalPages': tot,
      });
      _persistCurrentPageCtrl.text = updated.currentPage != null ? '${updated.currentPage}' : '';
      _persistTotalPagesCtrl.text = updated.readingTotalPages != null ? '${updated.readingTotalPages}' : '';
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('독서 진행을 저장했습니다.')));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

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
      await _loadSidecars(api, _displayBook(library));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _saveMyRating(BuildContext context, UserBook b, int? stars) async {
    final api = _api(context);
    final library = context.read<LibraryController>();
    try {
      await library.updateBook(b.id, {'rating': stars});
      if (!context.mounted) return;
      await _loadSidecars(api, _displayBook(library));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _saveLocation(BuildContext context, UserBook b) async {
    final api = _api(context);
    final library = context.read<LibraryController>();
    final loc = _locationCtrl.text.trim();
    try {
      await library.updateBook(b.id, {'location': loc.isEmpty ? null : loc});
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('위치를 저장했습니다.')));
      await _loadSidecars(api, _displayBook(library));
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
      await _loadSidecars(api, _displayBook(library));
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

  String _formatMemoTime(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return DateFormat.yMMMd(Localizations.localeOf(context).toString()).add_jm().format(dt);
    } catch (_) {
      return iso;
    }
  }

  String _formatEventTime(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return DateFormat.yMMMd(Localizations.localeOf(context).toString()).add_jm().format(dt);
    } catch (_) {
      return iso;
    }
  }

  String _payloadLine(Map<String, dynamic> p) {
    if (p.isEmpty) {
      return '';
    }
    final cp = p['currentPage'];
    if (cp != null) {
      return '현재 페이지 $cp';
    }
    return p.toString();
  }

  String? _communityRatingLine(UserBook b) {
    final avg = b.communityRatingAvg;
    final n = b.communityRatingCount;
    if (avg == null || n <= 0) {
      return null;
    }
    return '모두의 평균 ${avg.toStringAsFixed(1)} ($n명)';
  }

  @override
  void initState() {
    super.initState();
    _initSpeech();
  }

  @override
  Widget build(BuildContext context) {
    final library = context.watch<LibraryController>();
    final b = _displayBook(library);
    _syncLocationField(b);
    _syncReadingProgressFields(b);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final onSurface = colorScheme.onSurface;
    final onSurfaceVar = colorScheme.onSurfaceVariant;
    final cover = resolveCoverImageUrl(b.coverUrl);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          b.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        actions: [
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
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 108,
                child: cover != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(10),
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
                    : Container(
                        height: 162,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(8),
                          child: Text(
                            b.title,
                            maxLines: 4,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                            style: theme.textTheme.labelMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: onSurface,
                            ),
                          ),
                        ),
                      ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      b.title,
                      style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800, height: 1.2),
                    ),
                    if (b.authors.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        b.authors.join(', '),
                        style: theme.textTheme.bodyMedium?.copyWith(color: onSurfaceVar),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Text('내 평점', style: theme.textTheme.labelMedium?.copyWith(color: onSurfaceVar)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        ...List.generate(5, (i) {
                          final n = i + 1;
                          final filled = b.rating != null && b.rating! >= n;
                          return InkWell(
                            onTap: () => _saveMyRating(context, b, n),
                            borderRadius: BorderRadius.circular(20),
                            child: Padding(
                              padding: const EdgeInsets.only(right: 2),
                              child: Icon(
                                filled ? Icons.star_rounded : Icons.star_outline_rounded,
                                size: 28,
                                color: filled ? colorScheme.primary : onSurfaceVar,
                              ),
                            ),
                          );
                        }),
                        const SizedBox(width: 6),
                        if (b.rating != null)
                          TextButton(
                            onPressed: () => _saveMyRating(context, b, null),
                            child: const Text('지우기'),
                          ),
                      ],
                    ),
                    if (_communityRatingLine(b) != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        _communityRatingLine(b)!,
                        style: theme.textTheme.bodySmall?.copyWith(color: onSurfaceVar),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Text('위치', style: theme.textTheme.labelMedium?.copyWith(color: onSurfaceVar)),
                    const SizedBox(height: 4),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _locationCtrl,
                            decoration: const InputDecoration(
                              isDense: true,
                              hintText: '책꽂이, 서가 등',
                              border: OutlineInputBorder(),
                            ),
                            textInputAction: TextInputAction.done,
                            onSubmitted: (_) => _saveLocation(context, b),
                          ),
                        ),
                        const SizedBox(width: 8),
                        FilledButton(
                          onPressed: () => _saveLocation(context, b),
                          child: const Text('저장'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _DetailSection(
            title: '읽기 상태',
            child: Wrap(
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
          ),
          const SizedBox(height: 16),
          _DetailSection(
            title: '독서 진행 (서재에 저장)',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  b.effectiveTotalPages != null
                      ? '진행 분모: ${b.effectiveTotalPages}쪽'
                      : '서지에 총 쪽수가 없으면 아래에서 총 쪽을 직접 정할 수 있습니다.',
                  style: theme.textTheme.bodySmall?.copyWith(color: onSurfaceVar, height: 1.35),
                ),
                const SizedBox(height: 10),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _persistCurrentPageCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: '현재 쪽',
                          hintText: '비우면 진행 초기화',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _persistTotalPagesCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: '총 쪽(선택)',
                          hintText: '서지와 다를 때',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerLeft,
                  child: FilledButton(
                    onPressed: () => _saveReadingProgress(context, b),
                    child: const Text('진행 저장'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _DetailSection(
            title: '독서 이벤트',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
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
                  Text(
                    '타임라인에 진행 기록을 남깁니다(위 「진행 저장」과 별개).',
                    style: theme.textTheme.labelSmall?.copyWith(color: onSurfaceVar),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _eventProgressPageCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: '이벤트용 쪽',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      FilledButton(
                        onPressed: () {
                          final n = int.tryParse(_eventProgressPageCtrl.text.trim());
                          if (n == null || n < 1) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('페이지 번호를 입력해 주세요.')),
                            );
                            return;
                          }
                          _appendEvent(context, b, 'progress', payload: {'currentPage': n});
                          _eventProgressPageCtrl.clear();
                        },
                        child: const Text('타임라인 기록'),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          _DetailSection(
            title: '도서 정보',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: _detailSectionSpacedWidgets([
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
                        Text('소개', style: theme.textTheme.labelLarge?.copyWith(color: onSurfaceVar)),
                        const SizedBox(height: 6),
                        Text(
                          b.description!.trim(),
                          style: theme.textTheme.bodyMedium?.copyWith(height: 1.45, color: onSurface),
                        ),
                      ],
                    ),
                  ),
              ]),
            ),
          ),
          const SizedBox(height: 16),
          _DetailSection(
            title: '한줄평 (공개)',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
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
                  Text('한줄평이 없습니다.', style: theme.textTheme.bodyMedium?.copyWith(color: onSurfaceVar))
                else
                  ..._oneLiners.map((o) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(o.displayName ?? '사용자'),
                          subtitle: Text(o.body),
                        ),
                      )),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _DetailSection(
            title: '메모 (마크다운)',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
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
                    if (_speechUsable && !kIsWeb) ...[
                      const SizedBox(width: 2),
                      _speechListening
                          ? Padding(
                              padding: const EdgeInsets.all(12),
                              child: SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: theme.colorScheme.tertiary,
                                ),
                              ),
                            )
                          : IconButton(
                              tooltip: '음성으로 입력(최대 30초)',
                              onPressed: _dictateMemo,
                              icon: const Icon(Icons.mic_outlined),
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
                  Text('메모가 없습니다.', style: theme.textTheme.bodyMedium?.copyWith(color: onSurfaceVar))
                else
                  ..._memos.map((m) => Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _formatMemoTime(m.createdAt),
                                style: theme.textTheme.labelSmall?.copyWith(color: onSurfaceVar),
                              ),
                              const SizedBox(height: 8),
                              MarkdownBody(
                                data: m.bodyMd,
                                selectable: true,
                                softLineBreak: true,
                                styleSheet: MarkdownStyleSheet.fromTheme(theme),
                              ),
                            ],
                          ),
                        ),
                      )),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _DetailSection(
            title: '이벤트 타임라인 (나만)',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_sidecarError != null)
                  Text(_sidecarError!, style: TextStyle(color: theme.colorScheme.error, fontSize: 13)),
                if (_loadingSidecars)
                  const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
                else if (_events.isEmpty)
                  Text(
                    '기록이 없습니다.',
                    style: theme.textTheme.bodyMedium?.copyWith(color: onSurfaceVar),
                  )
                else
                  ..._events.take(30).map((e) {
                    final extra = _payloadLine(e.payload);
                    return ListTile(
                      dense: true,
                      title: Text(_eventLabel(e.eventType)),
                      subtitle: Text(
                        extra.isEmpty
                            ? _formatEventTime(e.occurredAt)
                            : '${_formatEventTime(e.occurredAt)} · $extra',
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontSize: 12,
                          color: onSurfaceVar,
                        ),
                      ),
                    );
                  }),
              ],
            ),
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
    final b = _displayBook(lib);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _loadSidecars(context.read<LibraryController>().api, b);
    });
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
