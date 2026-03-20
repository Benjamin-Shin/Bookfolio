import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/ui/screens/barcode_scan_screen.dart';
import 'package:bookfolio_mobile/src/util/isbn.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class BookFormScreen extends StatefulWidget {
  const BookFormScreen({super.key, this.prefill});

  final BookLookupResult? prefill;

  @override
  State<BookFormScreen> createState() => _BookFormScreenState();
}

class _BookFormScreenState extends State<BookFormScreen> {
  late final TextEditingController _isbnController;
  late final TextEditingController _titleController;
  late final TextEditingController _authorsController;
  late final TextEditingController _memoController;
  late final TextEditingController _ratingController;
  late final TextEditingController _locationController;
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
    final p = widget.prefill;
    _isbnController = TextEditingController(text: p?.isbn ?? '');
    _titleController = TextEditingController(text: p?.title ?? '');
    _authorsController = TextEditingController(text: p?.authors.join(', ') ?? '');
    _memoController = TextEditingController();
    _ratingController = TextEditingController();
    _locationController = TextEditingController();
    _coverUrl = p?.coverUrl;
    _publisher = p?.publisher;
    _publishedDate = p?.publishedDate;
    _description = p?.description;
    _priceKrw = p?.priceKrw;
  }

  @override
  void dispose() {
    _isbnController.dispose();
    _titleController.dispose();
    _authorsController.dispose();
    _memoController.dispose();
    _ratingController.dispose();
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

  @override
  Widget build(BuildContext context) {
    final library = context.read<LibraryController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('책 등록'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'ISBN으로 서지 자동 입력',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _isbnController,
            keyboardType: TextInputType.text,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(
              labelText: 'ISBN',
              hintText: '9788936434267 또는 978-89-3643-426-7',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _lookupBusy ? null : _openBarcodeScan,
                  icon: const Icon(Icons.qr_code_scanner),
                  label: const Text('바코드 스캔'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  onPressed: _lookupBusy ? null : _fetchBookMetaByIsbn,
                  icon: _lookupBusy
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.manage_search),
                  label: Text(_lookupBusy ? '조회 중…' : '도서 정보 불러오기'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: '제목',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _authorsController,
            decoration: const InputDecoration(
              labelText: '저자',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<BookFormat>(
            value: _format,
            items: BookFormat.values
                .map((format) => DropdownMenuItem(value: format, child: Text(format.name)))
                .toList(),
            onChanged: (value) => setState(() => _format = value ?? BookFormat.paper),
            decoration: const InputDecoration(
              labelText: '형식',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<ReadingStatus>(
            value: _status,
            items: ReadingStatus.values
                .map((status) => DropdownMenuItem(value: status, child: Text(status.name)))
                .toList(),
            onChanged: (value) => setState(() => _status = value ?? ReadingStatus.unread),
            decoration: const InputDecoration(
              labelText: '읽기 상태',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _ratingController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: '평점 (1-5)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _memoController,
            decoration: const InputDecoration(
              labelText: '메모',
              border: OutlineInputBorder(),
            ),
            maxLines: 5,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _locationController,
            decoration: const InputDecoration(
              labelText: '위치 (선택)',
              hintText: '집 / 회사 / 빌려줌 등',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () async {
              final normalizedIsbn = normalizeIsbnInput(_isbnController.text);
              final book = UserBook(
                id: '',
                bookId: '',
                title: _titleController.text.trim(),
                authors: _authorsController.text.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
                format: _format,
                readingStatus: _status,
                rating: int.tryParse(_ratingController.text.trim()),
                memo: _memoController.text.trim().isEmpty ? null : _memoController.text.trim(),
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
              if (!context.mounted) return;
              Navigator.of(context).pop();
            },
            child: const Text('저장'),
          ),
        ],
      ),
    );
  }
}
