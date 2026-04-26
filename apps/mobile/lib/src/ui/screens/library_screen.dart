import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/book_ui_labels.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/library/book_detail_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/book_form_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/library/library_analysis_screen.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

enum _ShelfTab { all, completed, unread, life }

enum _LibrarySort { updated, title, rating }

class _LibraryScreenState extends State<LibraryScreen> {
  static const _kPrimary = Color(0xFF033319);

  late final TextEditingController _searchCtrl;
  _ShelfTab _tab = _ShelfTab.all;
  _LibrarySort _sort = _LibrarySort.updated;

  @override
  void initState() {
    super.initState();
    final lib = context.read<LibraryController>();
    _searchCtrl = TextEditingController(text: lib.booksSearchQuery);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<LibraryController>().loadBooks();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _applySearch() async {
    await context
        .read<LibraryController>()
        .setBooksListFilters(search: _searchCtrl.text);
  }

  Future<void> _openAddBook() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(builder: (_) => const BookFormScreen()),
    );
    if (!mounted) return;
    await context.read<LibraryController>().loadBooks();
  }

  List<UserBook> _applyViewFilters(List<UserBook> books) {
    var out = [...books];
    switch (_tab) {
      case _ShelfTab.all:
        break;
      case _ShelfTab.completed:
        out = out
            .where((e) => e.readingStatus == ReadingStatus.completed)
            .toList();
      case _ShelfTab.unread:
        out =
            out.where((e) => e.readingStatus == ReadingStatus.unread).toList();
      case _ShelfTab.life:
        out = out.where((e) => (e.rating ?? 0) >= 5).toList();
    }

    switch (_sort) {
      case _LibrarySort.updated:
        break;
      case _LibrarySort.title:
        out.sort(
            (a, b) => a.title.toLowerCase().compareTo(b.title.toLowerCase()));
      case _LibrarySort.rating:
        out.sort((a, b) => (b.rating ?? -1).compareTo(a.rating ?? -1));
    }
    return out;
  }

  @override
  Widget build(BuildContext context) {
    final library = context.watch<LibraryController>();
    final books = _applyViewFilters(library.books);

    final totalCount = library.books.length;
    final completedCount = library.books
        .where((b) => b.readingStatus == ReadingStatus.completed)
        .length;
    final unreadCount = library.books
        .where((b) => b.readingStatus == ReadingStatus.unread)
        .length;
    final lifeCount = library.books.where((b) => (b.rating ?? 0) >= 5).length;

    return SizedBox.expand(
      child: RefreshIndicator(
        onRefresh: () => library.loadBooks(),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: bookfolioShellTabScrollPadding(context),
          children: [
            _header(),
            const SizedBox(height: 12),
            _topTabs(),
            const SizedBox(height: 12),
            _greenSummaryBanner(
              totalCount: totalCount,
              completedCount: completedCount,
              unreadCount: unreadCount,
              lifeCount: lifeCount,
            ),
            const SizedBox(height: 14),
            _searchSortRow(),
            const SizedBox(height: 12),
            if (library.isLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 36),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (library.error != null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  library.error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              )
            else if (books.isEmpty)
              _emptyPanel()
            else
              LayoutBuilder(
                builder: (context, constraints) {
                  final columns = constraints.maxWidth >= 720
                      ? 3
                      : constraints.maxWidth >= 500
                          ? 2
                          : 2;
                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: books.length,
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: columns,
                      mainAxisSpacing: 8,
                      crossAxisSpacing: 8,
                      childAspectRatio: columns == 3 ? 1.38 : 1.55,
                    ),
                    itemBuilder: (context, index) =>
                        _LibraryListCard(book: books[index]),
                  );
                },
              ),
            const SizedBox(height: 14),
            Center(
              child: TextButton.icon(
                onPressed: library.canGoToNextBooksPage
                    ? () => library.goToBooksPage(library.booksPage + 1)
                    : null,
                iconAlignment: IconAlignment.end,
                icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 20),
                label: Text(
                  '더 불러오기',
                  style: GoogleFonts.manrope(
                      fontSize: 22 / 2, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _header() {
    return Row(
      children: [
        Expanded(
          child: Center(
            child: Text(
              '내 서가',
              style: GoogleFonts.manrope(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: _kPrimary,
              ),
            ),
          ),
        ),
        IconButton(
          tooltip: '도서 추가',
          onPressed: _openAddBook,
          icon: const Icon(Icons.notifications_none_rounded),
        ),
      ],
    );
  }

  Widget _topTabs() {
    final scheme = Theme.of(context).colorScheme;
    Widget tab(_ShelfTab value, String label) {
      final selected = _tab == value;
      return Expanded(
        child: InkWell(
          onTap: () => setState(() => _tab = value),
          borderRadius: BorderRadius.circular(999),
          child: Container(
            height: 44,
            decoration: BoxDecoration(
              color: selected ? _kPrimary : Colors.transparent,
              borderRadius: BorderRadius.circular(999),
            ),
            alignment: Alignment.center,
            child: Text(
              label,
              style: GoogleFonts.manrope(
                fontSize: 15,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                color: selected ? scheme.onPrimary : scheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
      );
    }

    return Container(
      height: 48,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: scheme.outlineVariant),
      ),
      child: Row(
        children: [
          tab(_ShelfTab.all, '전체'),
          tab(_ShelfTab.completed, '읽은 책'),
          tab(_ShelfTab.unread, '읽고 싶은 책'),
          tab(_ShelfTab.life, '인생책'),
        ],
      ),
    );
  }

  Widget _greenSummaryBanner({
    required int totalCount,
    required int completedCount,
    required int unreadCount,
    required int lifeCount,
  }) {
    Widget stat(String label, int count) {
      return Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: GoogleFonts.manrope(
                    fontSize: 12, color: Colors.white.withValues(alpha: 0.92))),
            const SizedBox(height: 4),
            Text('$count권',
                style: GoogleFonts.manrope(
                    fontSize: 40 / 2,
                    fontWeight: FontWeight.w800,
                    color: Colors.white)),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF05552A), Color(0xFF033319)],
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
        child: Column(
          children: [
            Row(
              children: [
                stat('전체', totalCount),
                stat('읽은 책', completedCount),
                stat('읽고 싶은 책', unreadCount),
                stat('인생책', lifeCount),
                Container(
                  width: 66,
                  height: 84,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(10),
                    image: const DecorationImage(
                      image: AssetImage('assets/brand/600_Login_Back.png'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
              ),
              child: Column(
                children: [
                  InkWell(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                            builder: (_) => const LibraryAnalysisScreen()),
                      );
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        children: [
                          const Icon(Icons.bar_chart_rounded,
                              color: Colors.white, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text('내 서가 통계보기',
                                style: GoogleFonts.manrope(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13)),
                          ),
                          const Icon(Icons.chevron_right_rounded,
                              color: Colors.white, size: 18),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            const Icon(Icons.bar_chart_outlined,
                                color: Colors.white70, size: 16),
                            const SizedBox(width: 6),
                            Text('이번 달 $completedCount권 읽음',
                                style: GoogleFonts.manrope(
                                    color: Colors.white70, fontSize: 12)),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Row(
                          children: [
                            const Icon(Icons.trending_up_rounded,
                                color: Colors.white70, size: 16),
                            const SizedBox(width: 6),
                            Text('올해 $totalCount권 등록',
                                style: GoogleFonts.manrope(
                                    color: Colors.white70, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _searchSortRow() {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _searchCtrl,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _applySearch(),
            decoration: InputDecoration(
              hintText: '제목, 저자 검색',
              prefixIcon: const Icon(Icons.search_rounded),
              filled: true,
              fillColor: scheme.surfaceContainerLowest,
              isDense: true,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: scheme.outlineVariant),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: scheme.outlineVariant),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Container(
          height: 48,
          padding: const EdgeInsets.symmetric(horizontal: 10),
          decoration: BoxDecoration(
            color: scheme.surfaceContainerLowest,
            border: Border.all(color: scheme.outlineVariant),
            borderRadius: BorderRadius.circular(12),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<_LibrarySort>(
              value: _sort,
              onChanged: (v) {
                if (v == null) return;
                setState(() => _sort = v);
              },
              items: const [
                DropdownMenuItem(
                    value: _LibrarySort.updated, child: Text('최근 등록순')),
                DropdownMenuItem(value: _LibrarySort.title, child: Text('제목순')),
                DropdownMenuItem(
                    value: _LibrarySort.rating, child: Text('평점순')),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _emptyPanel() {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      height: 160,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: scheme.outlineVariant),
      ),
      child: Text(
        '표시할 도서가 없습니다.',
        style: GoogleFonts.manrope(fontSize: 14, color: scheme.onSurfaceVariant),
      ),
    );
  }
}

class _LibraryListCard extends StatelessWidget {
  const _LibraryListCard({required this.book});

  final UserBook book;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final cover = resolveCoverImageUrl(book.coverUrl);

    return InkWell(
      onTap: () async {
        await Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (_) => BookDetailScreen(book: book)),
        );
        if (context.mounted) {
          await context.read<LibraryController>().loadBooks();
        }
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: scheme.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: scheme.outlineVariant),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                width: 62,
                height: 88,
                child: cover != null
                    ? Image.network(
                        cover,
                        fit: BoxFit.cover,
                        headers: kCoverImageRequestHeaders,
                      )
                    : ColoredBox(color: scheme.surfaceContainerHigh),
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          book.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.manrope(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              height: 1.15),
                        ),
                      ),
                      const Icon(Icons.more_vert_rounded,
                          size: 18, color: Color(0xFF6F6B67)),
                    ],
                  ),
                  const SizedBox(height: 1),
                  Text(
                    book.authors.isEmpty ? '저자 미상' : book.authors.join(', '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.manrope(
                        fontSize: 12, color: scheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 6),
                  _statusChip(context, readingStatusLabelKo(book.readingStatus)),
                  const SizedBox(height: 4),
                  Text(
                    '등록일 ${_displayDate(book)}',
                    style: GoogleFonts.manrope(
                        fontSize: 11, color: scheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _displayDate(UserBook book) {
    final raw = book.publishedDate;
    if (raw == null || raw.isEmpty) return '-';
    if (raw.length >= 10) return raw.substring(0, 10);
    return raw;
  }

  Widget _statusChip(BuildContext context, String label) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: scheme.secondaryContainer,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: GoogleFonts.manrope(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: scheme.onSecondaryContainer),
      ),
    );
  }
}
