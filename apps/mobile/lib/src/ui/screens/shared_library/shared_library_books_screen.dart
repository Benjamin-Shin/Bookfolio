import 'package:seogadam_mobile/src/models/shared_library_models.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/shared_library/shared_library_book_detail_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/shared_library/shared_library_edit_screen.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class SharedLibraryBooksScreen extends StatefulWidget {
  const SharedLibraryBooksScreen({
    super.key,
    required this.libraryId,
    required this.libraryName,
    this.librarySummary,
    this.embeddedInShell = false,
    this.onBack,
  });

  final String libraryId;
  final String libraryName;
  final SharedLibrarySummary? librarySummary;
  final bool embeddedInShell;
  final VoidCallback? onBack;

  @override
  State<SharedLibraryBooksScreen> createState() => _SharedLibraryBooksScreenState();
}

class _SharedLibraryBooksScreenState extends State<SharedLibraryBooksScreen> {
  final BookfolioApi _api = BookfolioApi();
  final TextEditingController _ownedSearchCtrl = TextEditingController();
  List<SharedLibraryBookSummary> _books = const [];
  SharedLibrarySummary? _librarySummary;
  late String _libraryName;
  bool _loading = true;
  String? _error;
  int _segment = 0; // 0=전체 1=읽는책

  @override
  void initState() {
    super.initState();
    _librarySummary = widget.librarySummary;
    _libraryName = widget.librarySummary?.name ?? widget.libraryName;
    Future.microtask(() {
      if (!mounted) return;
      final auth = context.read<AuthController>();
      _api.accessToken = () => auth.session?.accessToken;
      _load();
    });
  }

  @override
  void dispose() {
    _ownedSearchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (_librarySummary == null) {
        final libs = await _api.fetchSharedLibraries();
        SharedLibrarySummary? matched;
        for (final lib in libs) {
          if (lib.id == widget.libraryId) {
            matched = lib;
            break;
          }
        }
        if (matched != null) {
          _librarySummary = matched;
          _libraryName = matched.name;
        }
      }
      final books = await _api.fetchSharedLibraryBooks(widget.libraryId);
      if (!mounted) return;
      setState(() {
        _books = books;
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

  List<SharedLibraryBookSummary> _currentBooks() {
    if (_segment == 0) return _books;
    return _books
        .where((e) => e.owners.any((o) => o.readingStatus == 'reading'))
        .toList();
  }

  List<SharedLibraryBookSummary> _filterOwnedBooks(
      List<SharedLibraryBookSummary> books) {
    final query = _ownedSearchCtrl.text.trim().toLowerCase();
    if (query.isEmpty) return books;
    return books.where((book) {
      final title = book.title.toLowerCase();
      final authors = book.authors.join(' ').toLowerCase();
      final owners = book.owners
          .map((owner) => owner.displayName.trim().toLowerCase())
          .join(' ');
      return title.contains(query) ||
          authors.contains(query) ||
          owners.contains(query);
    }).toList();
  }

  bool get _canEditLibrary => _librarySummary?.myRole == 'owner';

  Future<void> _openEditLibrary() async {
    final summary = _librarySummary;
    if (summary == null || !_canEditLibrary) return;
    final updated = await Navigator.of(context).push<SharedLibrarySummary>(
      MaterialPageRoute(builder: (_) => SharedLibraryEditScreen(initial: summary)),
    );
    if (updated == null || !mounted) return;
    setState(() {
      _librarySummary = updated;
      _libraryName = updated.name;
    });
  }

  @override
  Widget build(BuildContext context) {
    final body = _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
            ? Center(child: Text(_error!))
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: widget.embeddedInShell
                      ? bookfolioShellTabScrollPadding(context).copyWith(top: 14)
                      : const EdgeInsets.fromLTRB(16, 14, 16, 24),
                  children: [
                    if (widget.embeddedInShell && widget.onBack != null) ...[
                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton.icon(
                          onPressed: widget.onBack,
                          icon: const Icon(Icons.arrow_back_rounded),
                          label: const Text('모임서가 목록으로'),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    _heroCard(),
                    const SizedBox(height: 14),
                    SegmentedButton<int>(
                      segments: const [
                        ButtonSegment(value: 0, label: Text('전체')),
                        ButtonSegment(value: 1, label: Text('읽는 책')),
                      ],
                      selected: {_segment},
                      onSelectionChanged: (selection) {
                        setState(() => _segment = selection.first);
                      },
                    ),
                    const SizedBox(height: 16),
                    _memberStrip(),
                    const SizedBox(height: 16),
                    _readingBookList(
                      '회원들이 현재 읽고 있는 책',
                      _currentBooks()
                          .where((e) => e.owners.any((o) => o.readingStatus == 'reading'))
                          .toList(),
                    ),
                    const SizedBox(height: 16),
                    _ownedBookList('회원들이 소장하고 있는 책', _filterOwnedBooks(_currentBooks())),
                  ],
                ),
              );

    if (widget.embeddedInShell) {
      return body;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_libraryName),
        actions: [
          if (_canEditLibrary)
            IconButton(
              tooltip: '모임서가 편집',
              onPressed: _openEditLibrary,
              icon: const Icon(Icons.edit_rounded),
            ),
        ],
      ),
      body: body,
    );
  }

  Widget _heroCard() {
    final desc = (_librarySummary?.description ?? '').trim();
    final image = (_librarySummary?.imageUrl ?? '').trim();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [Color(0xFF0E6A3C), Color(0xFF0D4C2C)],
        ),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: 120,
              height: 92,
              child: image.isNotEmpty
                  ? Image.network(image, fit: BoxFit.cover)
                  : const ColoredBox(color: Color(0x1AFFFFFF)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _libraryName,
                  style: GoogleFonts.manrope(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  desc.isEmpty ? '함께 읽고 나누는 모임서가' : desc,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.manrope(
                    fontSize: 12,
                    height: 1.35,
                    color: Colors.white.withValues(alpha: 0.92),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '멤버 ${_members().length}명  |  책 ${_books.length}권',
                  style: GoogleFonts.manrope(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<_MemberProfile> _members() {
    final map = <String, _MemberProfile>{};
    for (final book in _books) {
      for (final owner in book.owners) {
        final name = owner.displayName.trim();
        if (name.isEmpty) continue;
        final key = owner.userId.trim().isNotEmpty ? owner.userId.trim() : name;
        if (!map.containsKey(key)) {
          map[key] = _MemberProfile(name: name, avatarUrl: owner.avatarUrl?.trim());
          continue;
        }
        if ((map[key]!.avatarUrl ?? '').isEmpty &&
            (owner.avatarUrl ?? '').trim().isNotEmpty) {
          map[key] = _MemberProfile(name: name, avatarUrl: owner.avatarUrl?.trim());
        }
      }
    }
    return map.values.toList();
  }

  Widget _memberStrip() {
    final scheme = Theme.of(context).colorScheme;
    final members = _members();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: Text('회원들', style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w800))),
            Text(
              '${members.length}명 참여 중',
              style: GoogleFonts.manrope(
                fontSize: 12,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 82,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: members.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, i) {
              final member = members[i];
              final name = member.name;
              final avatarUrl = member.avatarUrl;
              return SizedBox(
                width: 58,
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 23,
                      backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
                      child: avatarUrl == null || avatarUrl.isEmpty
                          ? Text(name.characters.first, style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700))
                          : null,
                    ),
                    const SizedBox(height: 6),
                    Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.manrope(fontSize: 11)),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _readingBookList(String title, List<SharedLibraryBookSummary> books) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        if (books.isEmpty)
          Text('표시할 책이 없습니다.', style: GoogleFonts.manrope(fontSize: 12))
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: books.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) => _SharedLibraryOwnedBookCard(
              book: books[index],
              libraryName: _libraryName,
              badgeLabel: '읽는 중',
            ),
          ),
      ],
    );
  }

  Widget _ownedBookList(String title, List<SharedLibraryBookSummary> books) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        TextField(
          controller: _ownedSearchCtrl,
          onChanged: (_) => setState(() {}),
          textInputAction: TextInputAction.search,
          decoration: InputDecoration(
            hintText: '책 제목, 저자, 소장자 검색',
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
        const SizedBox(height: 10),
        if (books.isEmpty)
          Text('표시할 책이 없습니다.', style: GoogleFonts.manrope(fontSize: 12))
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: books.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) => _SharedLibraryOwnedBookCard(
              book: books[index],
              libraryName: _libraryName,
            ),
          ),
      ],
    );
  }
}

class _SharedLibraryOwnedBookCard extends StatelessWidget {
  const _SharedLibraryOwnedBookCard({
    required this.book,
    required this.libraryName,
    this.badgeLabel,
  });

  final SharedLibraryBookSummary book;
  final String libraryName;
  final String? badgeLabel;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final cover = resolveCoverImageUrl(book.coverUrl);
    final ownerNames = book.owners
        .map((owner) => owner.displayName.trim())
        .where((name) => name.isNotEmpty)
        .toSet()
        .join(', ');

    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => SharedLibraryBookDetailScreen(
              book: book,
              libraryName: libraryName,
            ),
          ),
        );
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
                width: 110,
                height: 160,
                child: cover != null
                    ? Image.network(
                        cover,
                        fit: BoxFit.cover,
                        headers: kCoverImageRequestHeaders,
                      )
                    : ColoredBox(color: scheme.surfaceContainerHigh),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    book.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.manrope(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    book.authors.isEmpty ? '저자 미상' : book.authors.join(', '),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.manrope(
                      fontSize: 12,
                      color: const Color(0xFF6F6B67),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF3ED),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      badgeLabel ?? '소장 ${book.owners.length}명',
                      style: GoogleFonts.manrope(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0E6A3C),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    ownerNames.isEmpty ? '소장자 정보 없음' : ownerNames,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.manrope(
                      fontSize: 11,
                      color: const Color(0xFF6F6B67),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MemberProfile {
  const _MemberProfile({
    required this.name,
    this.avatarUrl,
  });

  final String name;
  final String? avatarUrl;
}
