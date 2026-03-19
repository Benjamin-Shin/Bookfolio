import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class BookDetailScreen extends StatefulWidget {
  const BookDetailScreen({super.key, required this.book});

  final UserBook book;

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  late final TextEditingController _memoController;
  late final TextEditingController _ratingController;
  late ReadingStatus _status;

  @override
  void initState() {
    super.initState();
    _memoController = TextEditingController(text: widget.book.memo ?? '');
    _ratingController = TextEditingController(text: widget.book.rating?.toString() ?? '');
    _status = widget.book.readingStatus;
  }

  @override
  Widget build(BuildContext context) {
    final library = context.read<LibraryController>();

    return Scaffold(
      appBar: AppBar(title: Text(widget.book.title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(widget.book.authors.join(', '), style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text('형식: ${widget.book.format.name}'),
          const SizedBox(height: 16),
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
            decoration: const InputDecoration(labelText: '평점'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _memoController,
            maxLines: 6,
            decoration: const InputDecoration(labelText: '메모'),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () async {
              await library.updateBook(
                widget.book.id,
                {
                  'readingStatus': _status.name,
                  'rating': int.tryParse(_ratingController.text.trim()),
                  'memo': _memoController.text.trim().isEmpty ? null : _memoController.text.trim(),
                },
              );
              if (mounted) Navigator.of(context).pop();
            },
            child: const Text('수정 저장'),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () async {
              await library.deleteBook(widget.book.id);
              if (mounted) Navigator.of(context).pop();
            },
            child: const Text('이 책 삭제'),
          ),
        ],
      ),
    );
  }
}

