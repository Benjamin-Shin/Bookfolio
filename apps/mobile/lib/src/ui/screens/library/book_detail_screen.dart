import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/book_ui_labels.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/widgets/user_book_tags_input.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:seogadam_mobile/src/util/mutation_guard.dart';
import 'package:seogadam_mobile/src/util/quote_ocr.dart';
import 'package:seogadam_mobile/src/util/user_book_tags.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

/// 내 서가 도서 상세 — 독서 기록·메모·캐논 공개 한줄평.
///
/// History:
/// - 2026-05-24: 내 서가 태그 추가·삭제·저장 (`UserBookTagsInput`)
/// - 2026-05-24: 기록 수정·상태·평점 저장 연타 방지 (`AsyncActionGate`)
/// - 2026-05-24: 캐논 공개 한줄평 작성·저장·삭제(500자) UI
class BookDetailScreen extends StatefulWidget {
  const BookDetailScreen({super.key, required this.book});

  final UserBook book;

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  static const _kPrimary = Color(0xFF0E6A3C);
  static const _kCardBorder = Color(0xFFE9E3DE);
  static const _kOneLinerMaxLength = 500;
  final _memoCtrl = TextEditingController();
  final _oneLinerCtrl = TextEditingController();
  final _currentPageCtrl = TextEditingController();
  final _totalPageCtrl = TextEditingController();
  final _speech = stt.SpeechToText();
  final _imagePicker = ImagePicker();

  List<UserBookMemo> _memos = const [];
  List<BookOneLinerItem> _canonReviews = const [];
  String? _myUserId;
  bool _loading = true;
  String? _error;
  bool _savingMemo = false;
  bool _savingOneLiner = false;
  bool _savingProgress = false;
  bool _savingTags = false;
  bool _voiceInProgress = false;
  late List<String> _draftTags;
  final _actionGate = AsyncActionGate();

  @override
  void initState() {
    super.initState();
    final b = widget.book;
    _currentPageCtrl.text = b.currentPage?.toString() ?? '';
    _totalPageCtrl.text =
        b.readingTotalPages?.toString() ?? b.pageCount?.toString() ?? '';
    _draftTags = List<String>.from(b.tags);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadSidecars();
      context.read<LibraryController>().refreshBookTagOptions();
    });
  }

  @override
  void dispose() {
    _memoCtrl.dispose();
    _oneLinerCtrl.dispose();
    _currentPageCtrl.dispose();
    _totalPageCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSidecars() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = context.read<LibraryController>().api;
      final results = await Future.wait([
        api.fetchUserBookMemos(widget.book.id),
        api.fetchBookOneLiners(widget.book.bookId),
        api.fetchMeProfile(),
      ]);
      if (!mounted) return;
      final profile = results[2] as MeAppProfile;
      final reviews = (results[1] as List<BookOneLinerItem>)
          .where((e) => e.body.trim().isNotEmpty)
          .toList();
      final mine = reviews
          .where((e) => e.userId == profile.id)
          .map((e) => e.body.trim())
          .firstWhere((body) => body.isNotEmpty, orElse: () => '');
      setState(() {
        _memos = results[0] as List<UserBookMemo>;
        _canonReviews = reviews;
        _myUserId = profile.id;
        _oneLinerCtrl.text = mine;
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

  Future<void> _saveStatus(ReadingStatus status) async {
    await _actionGate.run('saveStatus', () async {
      try {
        await context.read<LibraryController>().updateBook(widget.book.id, {
          'readingStatus': status.name,
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('상태를 변경했습니다.')),
        );
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString())));
      }
    });
  }

  bool _tagsDirty(UserBook saved) {
    final draft = normalizeUserBookTags(_draftTags);
    final current = normalizeUserBookTags(saved.tags);
    if (draft.length != current.length) return true;
    for (var i = 0; i < draft.length; i++) {
      if (draft[i] != current[i]) return true;
    }
    return false;
  }

  Future<void> _saveTags() async {
    await _actionGate.run('saveTags', () async {
      if (mounted) setState(() => _savingTags = true);
      final normalized = normalizeUserBookTags(_draftTags);
      try {
        final library = context.read<LibraryController>();
        await library.updateBook(widget.book.id, {'tags': normalized});
        await library.refreshBookTagOptions();
        if (!mounted) return;
        final saved = library.bookForDetail(widget.book);
        setState(() => _draftTags = List<String>.from(saved.tags));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('태그를 저장했습니다.')),
        );
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString())));
      } finally {
        if (mounted) setState(() => _savingTags = false);
      }
    });
  }

  Future<void> _saveRating(int? rating) async {
    await _actionGate.run('saveRating', () async {
      try {
        await context.read<LibraryController>().updateBook(widget.book.id, {
          'rating': rating,
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('평점을 저장했습니다.')),
        );
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString())));
      }
    });
  }

  Future<void> _saveProgress() async {
    await _actionGate.run('saveProgress', () async {
      if (mounted) setState(() => _savingProgress = true);
      final cur = int.tryParse(_currentPageCtrl.text.trim());
      final total = int.tryParse(_totalPageCtrl.text.trim());
      try {
        await context.read<LibraryController>().updateBook(widget.book.id, {
          'currentPage': cur,
          'readingTotalPages': total,
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('독서 진행도를 저장했습니다.')),
        );
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString())));
      } finally {
        if (mounted) setState(() => _savingProgress = false);
      }
    });
  }

  Future<void> _createMemo(
    String text, {
    String successMessage = '메모를 저장했습니다.',
  }) async {
    if (text.isEmpty) return;
    if (_savingMemo) return;
    setState(() => _savingMemo = true);
    try {
      await context
          .read<LibraryController>()
          .api
          .createUserBookMemo(widget.book.id, text);
      if (!mounted) return;
      _memoCtrl.clear();
      await _loadSidecars();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(successMessage)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) {
        setState(() => _savingMemo = false);
      }
    }
  }

  Future<void> _saveTypedMemo() async {
    await _createMemo(_memoCtrl.text.trim());
  }

  Future<void> _saveOneLiner() async {
    final text = _oneLinerCtrl.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('한줄평을 입력해 주세요.')),
      );
      return;
    }
    if (text.length > _kOneLinerMaxLength) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('한줄평은 $_kOneLinerMaxLength자 이내로 입력해 주세요.'),
        ),
      );
      return;
    }
    if (_savingOneLiner) return;
    setState(() => _savingOneLiner = true);
    try {
      await context
          .read<LibraryController>()
          .api
          .upsertOneLiner(widget.book.id, text);
      if (!mounted) return;
      await _loadSidecars();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('한줄평을 저장했습니다.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _savingOneLiner = false);
    }
  }

  Future<void> _clearOneLiner() async {
    if (_savingOneLiner) return;
    setState(() => _savingOneLiner = true);
    try {
      await context.read<LibraryController>().api.clearOneLiner(widget.book.id);
      if (!mounted) return;
      _oneLinerCtrl.clear();
      await _loadSidecars();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('한줄평을 삭제했습니다.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _savingOneLiner = false);
    }
  }

  Future<void> _saveVoiceMemo() async {
    if (_voiceInProgress) return;
    setState(() => _voiceInProgress = true);
    try {
      final available = await _speech.initialize();
      if (!available) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('음성 인식을 사용할 수 없습니다. 권한을 확인해 주세요.')),
        );
        return;
      }
      String recognized = '';
      await _speech.listen(
        localeId: 'ko_KR',
        listenFor: const Duration(seconds: 20),
        pauseFor: const Duration(seconds: 3),
        onResult: (result) {
          recognized = result.recognizedWords.trim();
        },
      );
      await Future<void>.delayed(const Duration(seconds: 3));
      await _speech.stop();
      final text = recognized.trim();
      if (!mounted || text.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('음성이 인식되지 않았습니다. 다시 시도해 주세요.')),
          );
        }
        return;
      }
      await _createMemo(
        '[음성메모]\n$text',
        successMessage: '음성 메모를 추가했습니다.',
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _voiceInProgress = false);
    }
  }

  Future<void> _saveCameraMemo() async {
    try {
      final captured = await _imagePicker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
      );
      if (captured == null || !mounted) return;
      final ocrText =
          (await recognizeQuoteTextFromImageFile(captured.path)).trim();
      final body = ocrText.isEmpty
          ? '[카메라메모]\n(이미지에서 텍스트를 인식하지 못했습니다.)'
          : '[카메라메모]\n$ocrText';
      await _createMemo(
        body,
        successMessage: '카메라 메모를 추가했습니다.',
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = context.watch<LibraryController>().bookForDetail(widget.book);
    final cover = resolveCoverImageUrl(b.coverUrl);
    final total = b.effectiveTotalPages;
    final current = b.currentPage ?? 0;
    final progress =
        total != null && total > 0 ? (current / total).clamp(0.0, 1.0) : 0.0;

    return Scaffold(
      appBar: AppBar(title: const Text('도서 상세')),
      body: ListView(
        padding: bookfolioMobileScrollPadding(context),
        children: [
          _topCard(b, cover),
          const SizedBox(height: 16),
          _canonReviewCard(),
          const SizedBox(height: 12),
          _recordCard(b, progress, current, total),
          const SizedBox(height: 12),
          _tagsCard(b),
          const SizedBox(height: 12),
          _ratingCard(b.rating),
          const SizedBox(height: 12),
          _memoCard(),
          const SizedBox(height: 12),
          _progressCard(progress),
          if (_loading)
            const Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator())),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(10),
              child: Text(_error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ),
        ],
      ),
    );
  }

  Widget _topCard(UserBook b, String? cover) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _kCardBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 112,
              height: 164,
              child: cover != null
                  ? Image.network(
                      cover,
                      fit: BoxFit.cover,
                      headers: kCoverImageRequestHeaders,
                      errorBuilder: (_, __, ___) =>
                          kCoverImageErrorPlaceholder,
                    )
                  : const ColoredBox(color: Color(0xFFE9E3DE)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(b.title,
                    style: GoogleFonts.manrope(
                        fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text(b.authors.join(', '),
                    style: GoogleFonts.manrope(fontSize: 12)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  children: [
                    _chip(bookFormatLabelKo(b.format)),
                    _chip(
                        (b.publisher ?? '').isEmpty ? '출판사 미지정' : b.publisher!),
                  ],
                ),
                const SizedBox(height: 12),
                Text('출간일  ${b.publishedDate ?? '-'}',
                    style: GoogleFonts.manrope(fontSize: 12)),
                Text('ISBN  ${b.isbn ?? '-'}',
                    style: GoogleFonts.manrope(fontSize: 12)),
                const SizedBox(height: 8),
                Text(
                  (b.description ?? '').isEmpty
                      ? '책 소개가 없습니다.'
                      : b.description!,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.manrope(fontSize: 12, height: 1.45),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _recordCard(UserBook b, double progress, int current, int? total) {
    final scheme = Theme.of(context).colorScheme;
    return _card(
      title: '내 독서 기록',
      trailing:
          TextButton(
            onPressed: _savingProgress ? null : _saveProgress,
            child: Text(_savingProgress ? '저장 중…' : '기록 수정'),
          ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _chip(readingStatusLabelKo(b.readingStatus)),
              const SizedBox(width: 8),
              DropdownButton<ReadingStatus>(
                value: b.readingStatus,
                underline: const SizedBox.shrink(),
                items: ReadingStatus.values
                    .map((s) => DropdownMenuItem(
                        value: s, child: Text(readingStatusLabelKo(s))))
                    .toList(),
                onChanged: (v) {
                  if (v != null) _saveStatus(v);
                },
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text('$current',
                  style: GoogleFonts.manrope(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: _kPrimary)),
              Text(' / ${total ?? '-'}쪽',
                  style: GoogleFonts.manrope(fontSize: 14)),
              const Spacer(),
              SizedBox(
                width: 84,
                child: TextField(
                  controller: _currentPageCtrl,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: '현재', isDense: true),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 84,
                child: TextField(
                  controller: _totalPageCtrl,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: '총쪽', isDense: true),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: progress,
            minHeight: 10,
            borderRadius: BorderRadius.circular(999),
            color: _kPrimary,
            backgroundColor: _kCardBorder,
          ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              '${(progress * 100).round()}%',
              style: GoogleFonts.manrope(
                fontSize: 12,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _tagsCard(UserBook saved) {
    final library = context.watch<LibraryController>();
    final dirty = _tagsDirty(saved);
    return _card(
      title: '태그',
      trailing: TextButton(
        onPressed: (!_savingTags && dirty) ? _saveTags : null,
        child: Text(_savingTags ? '저장 중…' : '저장'),
      ),
      child: UserBookTagsInput(
        tags: _draftTags,
        suggestions: library.bookTagOptions,
        onChanged: (next) => setState(() => _draftTags = next),
      ),
    );
  }

  Widget _ratingCard(int? currentRating) {
    return _card(
      title: '내 평점',
      trailing: TextButton(
          onPressed: () => _saveRating(currentRating),
          child: const Text('평점 수정')),
      child: Row(
        children: [
          for (int i = 1; i <= 5; i++)
            IconButton(
              visualDensity: VisualDensity.compact,
              onPressed: () => _saveRating(i),
              icon: Icon(
                i <= (currentRating ?? 0)
                    ? Icons.star_rounded
                    : Icons.star_border_rounded,
                size: 26,
                color: const Color(0xFFFFC107),
              ),
            ),
          Text(
            '${(currentRating ?? 0).toStringAsFixed(1)} / 5.0',
            style: GoogleFonts.manrope(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }

  Widget _canonReviewCard() {
    final scheme = Theme.of(context).colorScheme;
    final charCount = _oneLinerCtrl.text.length;
    return _card(
      title: '한줄평',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            '이 책에 붙는 짧은 감상입니다. 저장하면 같은 도서를 본 다른 회원도 볼 수 있습니다.',
            style: GoogleFonts.manrope(
              fontSize: 11,
              height: 1.45,
              color: scheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _oneLinerCtrl,
            minLines: 2,
            maxLines: 4,
            maxLength: _kOneLinerMaxLength,
            enabled: !_savingOneLiner,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: '짧게 남겨 보세요.',
              border: const OutlineInputBorder(),
              counterText: '$charCount / $_kOneLinerMaxLength',
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              FilledButton(
                onPressed: _savingOneLiner ? null : _saveOneLiner,
                child: _savingOneLiner
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('저장'),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: _savingOneLiner ? null : _clearOneLiner,
                child: const Text('삭제'),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            '다른 회원 한줄평',
            style: GoogleFonts.manrope(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: scheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          if (_canonReviews.isEmpty)
            Text(
              '아직 등록된 한줄평이 없습니다.',
              style: GoogleFonts.manrope(fontSize: 12),
            )
          else
            ..._canonReviews.map(
              (review) {
                final isMine = review.userId == _myUserId;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: scheme.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(10),
                    border: isMine
                        ? Border.all(color: _kPrimary.withValues(alpha: 0.35))
                        : null,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            review.displayName?.trim().isNotEmpty == true
                                ? review.displayName!.trim()
                                : '회원',
                            style: GoogleFonts.manrope(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: scheme.onSurfaceVariant,
                            ),
                          ),
                          if (isMine) ...[
                            const SizedBox(width: 6),
                            Text(
                              '내 한줄평',
                              style: GoogleFonts.manrope(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: _kPrimary,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        review.body.trim(),
                        style: GoogleFonts.manrope(fontSize: 12, height: 1.4),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _memoCard() {
    final scheme = Theme.of(context).colorScheme;
    return _card(
      title: '내 메모',
      trailing: PopupMenuButton<String>(
        tooltip: '메모 추가 방식',
        onSelected: (value) {
          switch (value) {
            case 'voice':
              _saveVoiceMemo();
              break;
            case 'camera':
              _saveCameraMemo();
              break;
            case 'typed':
              _memoCtrl.selection = TextSelection(
                baseOffset: 0,
                extentOffset: _memoCtrl.text.length,
              );
              break;
          }
        },
        itemBuilder: (context) => const [
          PopupMenuItem<String>(
            value: 'typed',
            child: Text('직접 입력'),
          ),
          PopupMenuItem<String>(
            value: 'voice',
            child: Text('음성 메모 추가'),
          ),
          PopupMenuItem<String>(
            value: 'camera',
            child: Text('카메라 촬영 메모 추가'),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _memoCtrl,
            minLines: 2,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: '메모를 입력해 주세요.',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: _savingMemo ? null : _saveTypedMemo,
            icon: const Icon(Icons.note_add_outlined),
            label: const Text('직접 입력 메모 저장'),
          ),
          const SizedBox(height: 10),
          if (_memos.isEmpty)
            Text('아직 메모가 없습니다.', style: GoogleFonts.manrope(fontSize: 12))
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _memos.take(3).map((m) {
                return Container(
                  width: 108,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: scheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(m.bodyMd,
                      maxLines: 4,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.manrope(fontSize: 11, height: 1.35)),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }

  Widget _progressCard(double progress) {
    return _card(
      title: '독서 진행도',
      child: Row(
        children: [
          Expanded(
              child: _progressMetric('이번 주', '${(progress * 80).round()}쪽 읽음')),
          Expanded(
              child: _progressMetric(
                  '예상 완독', '${(5 - progress * 4).clamp(1, 9).round()}일')),
          Expanded(
              child: _progressMetric('목표 달성', '${(progress * 100).round()}%')),
        ],
      ),
    );
  }

  Widget _progressMetric(String label, String value) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      children: [
        Text(
          label,
          style: GoogleFonts.manrope(
            fontSize: 11,
            color: scheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 4),
        Text(value,
            style:
                GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700)),
      ],
    );
  }

  Widget _card(
      {required String title, Widget? trailing, required Widget child}) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: scheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(title,
                  style: GoogleFonts.manrope(
                      fontSize: 14, fontWeight: FontWeight.w800)),
              const Spacer(),
              if (trailing != null) trailing,
            ],
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }

  Widget _chip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF3ED),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label,
          style:
              GoogleFonts.manrope(fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}
