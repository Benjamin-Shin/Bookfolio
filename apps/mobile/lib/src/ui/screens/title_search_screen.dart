import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 제목·키워드로 서버 메타 검색 후 한 권을 선택해 등록 폼으로 돌아갑니다.
///
/// History:
/// - 2026-03-24: 최초 추가
class TitleSearchScreen extends StatefulWidget {
  const TitleSearchScreen({super.key});

  @override
  State<TitleSearchScreen> createState() => _TitleSearchScreenState();
}

class _TitleSearchScreenState extends State<TitleSearchScreen> {
  final TextEditingController _queryController = TextEditingController();
  bool _loading = false;
  String? _error;
  List<BookLookupResult> _results = const [];

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final q = _queryController.text.trim();
    if (q.isEmpty) {
      setState(() => _error = '검색어를 입력해 주세요.');
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final library = context.read<LibraryController>();
      final list = await library.searchBooksByTitle(q);
      if (!mounted) return;
      setState(() {
        _results = list;
        if (list.isEmpty) {
          _error = '검색 결과가 없습니다. 다른 키워드로 시도해 보세요.';
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '검색에 실패했습니다. 네트워크·서버 API 설정(네이버/Google)을 확인해 주세요.\n$e';
        _results = const [];
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('제목으로 검색'),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: TextField(
                    controller: _queryController,
                    textInputAction: TextInputAction.search,
                    decoration: const InputDecoration(
                      labelText: '제목 또는 키워드',
                      hintText: '예: 해리포터, 한강',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _loading ? null : _search(),
                  ),
                ),
                const SizedBox(width: 10),
                FilledButton(
                  onPressed: _loading ? null : _search,
                  child: _loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('검색'),
                ),
              ],
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _results.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final r = _results[index];
                final cover = resolveCoverImageUrl(r.coverUrl);
                final authors = r.authors.isEmpty ? '저자 정보 없음' : r.authors.join(', ');
                final sub = [
                  if (r.publisher != null && r.publisher!.trim().isNotEmpty) r.publisher!.trim(),
                  if (r.isbn.trim().isNotEmpty) 'ISBN ${r.isbn}',
                ].join(' · ');

                return Material(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(12),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () => Navigator.of(context).pop(r),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: SizedBox(
                              width: 56,
                              height: 80,
                              child: cover != null
                                  ? Image.network(
                                      cover,
                                      fit: BoxFit.cover,
                                      headers: kCoverImageRequestHeaders,
                                      errorBuilder: (_, __, ___) => const ColoredBox(
                                        color: Color(0xFFE0E0E0),
                                        child: Icon(Icons.menu_book_outlined),
                                      ),
                                    )
                                  : const ColoredBox(
                                      color: Color(0xFFE0E0E0),
                                      child: Icon(Icons.menu_book_outlined),
                                    ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  r.title,
                                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  authors,
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                if (sub.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    sub,
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                                        ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          Icon(
                            Icons.chevron_right,
                            color: Theme.of(context).colorScheme.outline,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
