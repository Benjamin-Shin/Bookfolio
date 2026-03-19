import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/ui/screens/book_detail_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/book_form_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<LibraryController>().loadBooks());
  }

  @override
  Widget build(BuildContext context) {
    final library = context.watch<LibraryController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('내 서재'),
        actions: [
          IconButton(
            onPressed: () => context.read<AuthController>().signOut(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const BookFormScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('책 추가'),
      ),
      body: RefreshIndicator(
        onRefresh: library.loadBooks,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (library.error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(library.error!, style: const TextStyle(color: Colors.red)),
              ),
            if (library.isLoading)
              const Center(child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              ))
            else if (library.books.isEmpty)
              const _EmptyLibrary()
            else
              ...library.books.map(
                (book) => Card(
                  child: ListTile(
                    title: Text(book.title),
                    subtitle: Text(
                      '${book.authors.join(", ")}\n${book.readingStatus.name} · ${book.format.name}',
                    ),
                    isThreeLine: true,
                    trailing: book.rating != null ? Text('★ ${book.rating}') : null,
                    onTap: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => BookDetailScreen(book: book)),
                      );
                    },
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _EmptyLibrary extends StatelessWidget {
  const _EmptyLibrary();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: const Column(
        children: [
          Icon(Icons.menu_book_rounded, size: 56),
          SizedBox(height: 12),
          Text('아직 등록한 책이 없습니다.'),
          SizedBox(height: 8),
          Text('바코드 스캔 또는 수동 입력으로 첫 책을 추가해보세요.'),
        ],
      ),
    );
  }
}

