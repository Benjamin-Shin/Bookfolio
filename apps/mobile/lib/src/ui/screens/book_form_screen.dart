import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/ui/screens/barcode_scan_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class BookFormScreen extends StatefulWidget {
  const BookFormScreen({super.key, this.prefill});

  final BookLookupResult? prefill;

  @override
  State<BookFormScreen> createState() => _BookFormScreenState();
}

class _BookFormScreenState extends State<BookFormScreen> {
  late final TextEditingController _titleController;
  late final TextEditingController _authorsController;
  late final TextEditingController _memoController;
  late final TextEditingController _ratingController;
  BookFormat _format = BookFormat.paper;
  ReadingStatus _status = ReadingStatus.unread;
  String? _isbn;
  String? _coverUrl;
  String? _publisher;
  String? _publishedDate;
  String? _description;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.prefill?.title ?? '');
    _authorsController = TextEditingController(text: widget.prefill?.authors.join(', ') ?? '');
    _memoController = TextEditingController();
    _ratingController = TextEditingController();
    _isbn = widget.prefill?.isbn;
    _coverUrl = widget.prefill?.coverUrl;
    _publisher = widget.prefill?.publisher;
    _publishedDate = widget.prefill?.publishedDate;
    _description = widget.prefill?.description;
  }

  @override
  Widget build(BuildContext context) {
    final library = context.read<LibraryController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('책 등록'),
        actions: [
          TextButton(
            onPressed: () async {
              final lookup = await Navigator.of(context).push<BookLookupResult>(
                MaterialPageRoute(builder: (_) => const BarcodeScanScreen()),
              );
              if (lookup == null || !mounted) return;
              setState(() {
                _titleController.text = lookup.title;
                _authorsController.text = lookup.authors.join(', ');
                _isbn = lookup.isbn;
                _coverUrl = lookup.coverUrl;
                _publisher = lookup.publisher;
                _publishedDate = lookup.publishedDate;
                _description = lookup.description;
              });
            },
            child: const Text('바코드'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _titleController,
            decoration: const InputDecoration(labelText: '제목'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _authorsController,
            decoration: const InputDecoration(labelText: '저자'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<BookFormat>(
            value: _format,
            items: BookFormat.values
                .map((format) => DropdownMenuItem(value: format, child: Text(format.name)))
                .toList(),
            onChanged: (value) => setState(() => _format = value ?? BookFormat.paper),
            decoration: const InputDecoration(labelText: '형식'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<ReadingStatus>(
            value: _status,
            items: ReadingStatus.values
                .map((status) => DropdownMenuItem(value: status, child: Text(status.name)))
                .toList(),
            onChanged: (value) => setState(() => _status = value ?? ReadingStatus.unread),
            decoration: const InputDecoration(labelText: '읽기 상태'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _ratingController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: '평점 (1-5)'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _memoController,
            decoration: const InputDecoration(labelText: '메모'),
            maxLines: 5,
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () async {
              final book = UserBook(
                id: '',
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
                isbn: _isbn,
                isOwned: true,
              );
              await library.createBook(book);
              if (mounted) Navigator.of(context).pop();
            },
            child: const Text('저장'),
          ),
        ],
      ),
    );
  }
}

