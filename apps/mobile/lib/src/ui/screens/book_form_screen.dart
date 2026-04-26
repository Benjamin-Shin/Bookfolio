import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/book_ui_labels.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/barcode_scan_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/camera_permission_rationale_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/title_keyword_lookup_screen.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class BookFormScreen extends StatefulWidget {
  const BookFormScreen({super.key, this.prefill, this.existingBook});

  final BookLookupResult? prefill;
  final UserBook? existingBook;

  bool get isEditing => existingBook != null;

  @override
  State<BookFormScreen> createState() => _BookFormScreenState();
}

class _BookFormScreenState extends State<BookFormScreen> {
  static const _kPrimary = Color(0xFF0E6A3C);
  static const _kCardBorder = Color(0xFFE9E3DE);
  final _queryCtrl = TextEditingController();
  final _memoCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  int _mode = 0; // 0 scan, 1 search
  BookLookupResult? _selected;
  ReadingStatus _status = ReadingStatus.unread;
  int _rating = 4;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    if (widget.prefill != null) _selected = widget.prefill;
    final ex = widget.existingBook;
    if (ex != null) {
      _selected = BookLookupResult(
        isbn: ex.isbn ?? '',
        title: ex.title,
        authors: ex.authors,
        publisher: ex.publisher,
        publishedDate: ex.publishedDate,
        coverUrl: ex.coverUrl,
        description: ex.description,
        priceKrw: ex.priceKrw,
        source: 'manual',
      );
      _status = ex.readingStatus;
      _rating = ex.rating ?? 4;
      _locationCtrl.text = ex.location ?? '';
    }
  }

  @override
  void dispose() {
    _queryCtrl.dispose();
    _memoCtrl.dispose();
    _locationCtrl.dispose();
    super.dispose();
  }

  Future<void> _scanIsbn() async {
    final proceed = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => const CameraPermissionRationaleScreen(
          purpose: CameraPermissionPurpose.isbnBarcodeScan,
        ),
      ),
    );
    if (proceed != true || !mounted) return;
    final lookup = await Navigator.of(context).push<BookLookupResult>(
      MaterialPageRoute(builder: (_) => const BarcodeScanScreen()),
    );
    if (lookup != null && mounted) {
      setState(() => _selected = lookup);
    }
  }

  Future<void> _searchByKeyword() async {
    final q = _queryCtrl.text.trim();
    if (q.isEmpty) return;
    setState(() => _busy = true);
    try {
      final results = await context.read<LibraryController>().api.searchBooksByTitle(q);
      if (!mounted) return;
      if (results.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('검색 결과가 없습니다.')),
        );
        return;
      }
      setState(() => _selected = results.first);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _openManualSearch() async {
    final lookup = await Navigator.of(context).push<BookLookupResult>(
      MaterialPageRoute(builder: (_) => const TitleKeywordLookupScreen()),
    );
    if (lookup != null && mounted) {
      setState(() => _selected = lookup);
    }
  }

  Future<void> _save() async {
    final selected = _selected;
    if (selected == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('먼저 책을 선택해 주세요.')),
      );
      return;
    }
    try {
      if (widget.isEditing) {
        await context.read<LibraryController>().updateBook(
          widget.existingBook!.id,
          {
            'readingStatus': _status.name,
            'rating': _rating,
            'location': _locationCtrl.text.trim().isEmpty ? null : _locationCtrl.text.trim(),
          },
        );
      } else {
        final book = UserBook(
          id: '',
          bookId: '',
          title: selected.title,
          authors: selected.authors,
          format: BookFormat.paper,
          readingStatus: _status,
          rating: _rating,
          coverUrl: selected.coverUrl,
          publisher: selected.publisher,
          publishedDate: selected.publishedDate,
          description: selected.description,
          isbn: selected.isbn.isEmpty ? null : selected.isbn,
          isOwned: true,
          priceKrw: selected.priceKrw,
          location: _locationCtrl.text.trim().isEmpty ? null : _locationCtrl.text.trim(),
        );
        await context.read<LibraryController>().createBook(book);
      }

      if (!mounted) return;
      Navigator.of(context).pop();
    } on BookfolioApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final selected = _selected;
    final cover = resolveCoverImageUrl(selected?.coverUrl);
    return Scaffold(
      appBar: AppBar(title: Text(widget.isEditing ? '책 수정' : '책 추가')),
      body: ListView(
        padding: bookfolioMobileScrollPadding(context),
        children: [
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 0, icon: Icon(Icons.qr_code_2), label: Text('ISBN 스캔')),
              ButtonSegment(value: 1, icon: Icon(Icons.search), label: Text('직접 검색')),
            ],
            selected: {_mode},
            onSelectionChanged: (selection) {
              setState(() => _mode = selection.first);
            },
          ),
          const SizedBox(height: 14),
          if (_mode == 0)
            _scanCard()
          else
            _searchCard(),
          const SizedBox(height: 14),
          if (selected != null) _selectedBookCard(selected, cover),
          const SizedBox(height: 14),
          _personalCard(),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _save,
            icon: const Icon(Icons.library_add, size: 20),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
              backgroundColor: _kPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            label: Text(widget.isEditing ? '수정 저장' : '내 서가에 담기'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () {
              _queryCtrl.clear();
              setState(() => _selected = null);
            },
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('검색 다시하기'),
          ),
        ],
      ),
    );
  }

  Widget _scanCard() {
    return _card(
      child: InkWell(
        onTap: _scanIsbn,
        borderRadius: BorderRadius.circular(12),
        child: Row(
          children: [
            Container(
              width: 96,
              height: 74,
              decoration: BoxDecoration(
                color: const Color(0xFFEFF3ED),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.photo_camera_outlined, size: 28, color: _kPrimary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('카메라로 ISBN 스캔', style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text('책 뒷면의 ISBN 바코드를 스캔하면\n정보를 빠르게 불러올 수 있어요.', style: GoogleFonts.manrope(fontSize: 12, height: 1.35)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right),
          ],
        ),
      ),
    );
  }

  Widget _searchCard() {
    return _card(
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _queryCtrl,
                  decoration: const InputDecoration(
                    hintText: '책 제목, 저자, 출판사 검색',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: _busy ? null : _searchByKeyword,
                style: FilledButton.styleFrom(
                  backgroundColor: _kPrimary,
                  minimumSize: const Size(70, 44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: _busy ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('검색'),
              ),
            ],
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(onPressed: _openManualSearch, child: const Text('검색 화면 열기')),
          ),
        ],
      ),
    );
  }

  Widget _selectedBookCard(BookLookupResult selected, String? cover) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('검색 결과', style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        _card(
          borderColor: _kPrimary,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 122,
                  height: 166,
                  child: cover != null ? Image.network(cover, fit: BoxFit.cover, headers: kCoverImageRequestHeaders) : const ColoredBox(color: Color(0xFFE9E3DE)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(selected.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    Text('${selected.authors.join(', ')}\n${selected.publisher ?? ''}', style: GoogleFonts.manrope(fontSize: 12, height: 1.35)),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 6,
                      children: [
                        _chip('소설'),
                        _chip('한국소설'),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text('ISBN   ${selected.isbn}', style: GoogleFonts.manrope(fontSize: 12)),
                  ],
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(top: 2),
                child: Icon(Icons.check_circle, size: 22, color: _kPrimary),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _personalCard() {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('나만의 정보 입력', style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          Text('독서 상태', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          SegmentedButton<ReadingStatus>(
            segments: ReadingStatus.values
                .map((s) => ButtonSegment(value: s, label: Text(readingStatusLabelKo(s))))
                .toList(),
            selected: {_status},
            onSelectionChanged: (selection) {
              setState(() => _status = selection.first);
            },
          ),
          const SizedBox(height: 12),
          Text('나의 평점', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w700)),
          Row(
            children: [
              for (int i = 1; i <= 5; i++)
                IconButton(
                  visualDensity: VisualDensity.compact,
                  onPressed: () => setState(() => _rating = i),
                  icon: Icon(i <= _rating ? Icons.star_rounded : Icons.star_border_rounded, size: 26, color: const Color(0xFFFFC107)),
                ),
              Text('$_rating.0 / 5.0', style: GoogleFonts.manrope(fontWeight: FontWeight.w700)),
            ],
          ),
          TextField(
            controller: _locationCtrl,
            decoration: const InputDecoration(
              labelText: '보관 위치 (선택)',
              hintText: '거실 책장 / 침실 / 서재',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _memoCtrl,
            maxLength: 200,
            minLines: 2,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: '나의 메모 (선택)',
              hintText: '이 책에 대한 내 생각을 기록해보세요.',
              border: OutlineInputBorder(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _card({required Widget child, Color? borderColor}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor ?? _kCardBorder),
      ),
      child: child,
    );
  }

  Widget _chip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFEEF3ED),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(text, style: GoogleFonts.manrope(fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}
