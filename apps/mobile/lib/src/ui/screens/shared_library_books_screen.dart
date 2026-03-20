import 'package:bookfolio_mobile/src/models/shared_library_models.dart';
import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class SharedLibraryBooksScreen extends StatefulWidget {
  const SharedLibraryBooksScreen({
    super.key,
    required this.libraryId,
    required this.libraryName,
  });

  final String libraryId;
  final String libraryName;

  @override
  State<SharedLibraryBooksScreen> createState() => _SharedLibraryBooksScreenState();
}

class _SharedLibraryBooksScreenState extends State<SharedLibraryBooksScreen> {
  final BookfolioApi _api = BookfolioApi();
  List<SharedLibraryBookSummary> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (!mounted) return;
      final auth = context.read<AuthController>();
      _api.accessToken = () => auth.session?.accessToken;
      _load();
    });
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await _api.fetchSharedLibraryBooks(widget.libraryId);
      if (!mounted) return;
      setState(() {
        _items = list;
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

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.libraryName),
        backgroundColor: const Color(0xFFEDE4D8),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFF5EDE2),
              Color(0xFFE8DCC8),
            ],
          ),
        ),
        child: RefreshIndicator(
          onRefresh: _load,
          color: colorScheme.primary,
          child: _loading
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: const [
                    SizedBox(height: 120),
                    Center(child: CircularProgressIndicator()),
                  ],
                )
              : _error != null
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(24),
                      children: [
                        Text(_error!, style: TextStyle(color: colorScheme.error)),
                      ],
                    )
                  : _items.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(24),
                          children: const [
                            Text('이 서재에 등록된 책이 없습니다.'),
                          ],
                        )
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(16),
                          itemCount: _items.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, i) {
                            final b = _items[i];
                            final authors = b.authors.isNotEmpty ? b.authors.join(', ') : '저자 미상';
                            final ownersLine = b.ownersLabel.isNotEmpty ? '소유자: ${b.ownersLabel}' : '';
                            return Material(
                              color: Colors.white.withValues(alpha: 0.55),
                              borderRadius: BorderRadius.circular(12),
                              child: ListTile(
                                title: Text(b.title, maxLines: 2, overflow: TextOverflow.ellipsis),
                                subtitle: Text(
                                  ownersLine.isNotEmpty ? '$authors\n$ownersLine' : authors,
                                  maxLines: 3,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                isThreeLine: ownersLine.isNotEmpty,
                              ),
                            );
                          },
                        ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Text(
            '멤버별 읽기 상태·책 추가는 웹의 공동서재 화면에서 할 수 있어요.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
