import 'package:seogadam_mobile/src/models/shared_library_models.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/shared_library/shared_library_books_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/shared_library/shared_library_edit_screen.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class SharedLibrariesScreen extends StatefulWidget {
  const SharedLibrariesScreen({super.key, this.embeddedInShell = false});

  final bool embeddedInShell;

  @override
  State<SharedLibrariesScreen> createState() => _SharedLibrariesScreenState();
}

class _SharedLibrariesScreenState extends State<SharedLibrariesScreen> {
  static const _kPrimary = BookfolioDesignTokens.primary;
  static const _kBannerImage = 'assets/brand/600_Login_Back.png';

  final BookfolioApi _api = BookfolioApi();
  List<SharedLibrarySummary> _items = const [];
  bool _loading = true;
  String? _error;
  bool _createdTab = true;
  SharedLibrarySummary? _selectedLibrary;

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
      final list = await _api.fetchSharedLibraries();
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

  List<SharedLibrarySummary> _created() =>
      _items.where((e) => e.myRole == 'owner').toList();
  List<SharedLibrarySummary> _joined() =>
      _items.where((e) => e.myRole != 'owner').toList();

  Future<void> _openCreate() async {
    final created = await Navigator.of(context).push<SharedLibrarySummary>(
      MaterialPageRoute(builder: (_) => const SharedLibraryEditScreen()),
    );
    if (created != null && mounted) {
      await _load();
    }
  }

  Future<void> _openEdit(SharedLibrarySummary lib) async {
    final updated = await Navigator.of(context).push<SharedLibrarySummary>(
      MaterialPageRoute(builder: (_) => SharedLibraryEditScreen(initial: lib)),
    );
    if (updated != null && mounted) {
      await _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.embeddedInShell && _selectedLibrary != null) {
      final selected = _selectedLibrary!;
      return SharedLibraryBooksScreen(
        embeddedInShell: true,
        onBack: () => setState(() => _selectedLibrary = null),
        libraryId: selected.id,
        libraryName: selected.name,
        librarySummary: selected,
      );
    }

    final body = _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
            ? Center(child: Text(_error!))
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: bookfolioShellTabScrollPadding(context),
                  children: [
                    _tabs(),
                    const SizedBox(height: 12),
                    _statusBanner(),
                    const SizedBox(height: 14),
                    FilledButton.icon(
                      onPressed: _openCreate,
                      icon: const Icon(Icons.add, size: 20),
                      style: FilledButton.styleFrom(
                        backgroundColor: _kPrimary,
                        minimumSize: const Size.fromHeight(50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      label: const Text('모임서가 만들기'),
                    ),
                    const SizedBox(height: 16),
                    _sectionList(
                      title: _createdTab ? '내가 만든 모임' : '참여 중인 모임',
                      items: _createdTab ? _created() : _joined(),
                    ),
                    const SizedBox(height: 16),
                    if (_createdTab) _sectionList(title: '참여 중인 모임', items: _joined()),
                  ],
                ),
              );

    if (widget.embeddedInShell) return body;
    return Scaffold(appBar: AppBar(title: const Text('모임서가')), body: body);
  }

  Widget _statusBanner() {
    return Container(
      height: 136,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: const LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [Color(0xFF0E6A3C), Color(0xFF0D4C2C)],
        ),
      ),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      child: Stack(
        children: [
          Positioned(
            right: -2,
            top: 0,
            bottom: 0,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.asset(
                _kBannerImage,
                fit: BoxFit.cover,
                width: 180,
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('모임서가 현황', style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.white)),
              const Spacer(),
              SizedBox(
                width: 190,
                child: Row(
                  children: [
                    Expanded(child: _countLabel('내가 만든 모임', _created().length)),
                    Container(width: 1, height: 44, color: Colors.white.withValues(alpha: 0.25)),
                    const SizedBox(width: 12),
                    Expanded(child: _countLabel('참여 중인 모임', _joined().length)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _tabs() {
    final scheme = Theme.of(context).colorScheme;
    Widget tab({
      required bool selected,
      required String label,
      required VoidCallback onTap,
    }) {
      return Expanded(
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOut,
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: selected ? _kPrimary : Colors.transparent,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: GoogleFonts.manrope(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: selected ? scheme.onPrimary : scheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: scheme.outlineVariant),
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: [
          tab(
            selected: _createdTab,
            label: '내가 만든 모임',
            onTap: () => setState(() => _createdTab = true),
          ),
          tab(
            selected: !_createdTab,
            label: '참여 중인 모임',
            onTap: () => setState(() => _createdTab = false),
          ),
        ],
      ),
    );
  }

  Widget _countLabel(String label, int count) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.manrope(fontSize: 11, color: Colors.white.withValues(alpha: 0.9))),
        const SizedBox(height: 4),
        Text('$count개', style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
      ],
    );
  }

  Widget _sectionList({
    required String title,
    required List<SharedLibrarySummary> items,
  }) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$title ${items.length}', style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        if (items.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerLowest,
              border: Border.all(color: scheme.outlineVariant),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text('표시할 모임이 없습니다.', style: GoogleFonts.manrope(fontSize: 12)),
          )
        else
          ...items.map((lib) => _libraryTile(lib)),
      ],
    );
  }

  Widget _libraryTile(SharedLibrarySummary lib) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: scheme.outlineVariant),
      ),
      child: ListTile(
        minTileHeight: 88,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: SizedBox(
            width: 68,
            height: 68,
            child: (lib.imageUrl ?? '').trim().isNotEmpty
                ? Image.network(lib.imageUrl!, fit: BoxFit.cover)
                : ColoredBox(color: scheme.surfaceContainerHigh),
          ),
        ),
        title: Text(lib.name, style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w800)),
        subtitle: Text(
          (lib.description ?? '').trim().isEmpty ? '${lib.kindLabel} 모임' : lib.description!,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.manrope(fontSize: 12, height: 1.35),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: scheme.secondaryContainer,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                lib.myRole == 'owner' ? '운영 중' : '참여 중',
                style: GoogleFonts.manrope(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: scheme.onSecondaryContainer,
                ),
              ),
            ),
            if (lib.myRole == 'owner')
              TextButton(
                onPressed: () => _openEdit(lib),
                style: TextButton.styleFrom(minimumSize: const Size(20, 20), padding: EdgeInsets.zero),
                child: const Text('편집', style: TextStyle(fontSize: 10)),
              ),
          ],
        ),
        onTap: () {
          if (widget.embeddedInShell) {
            setState(() => _selectedLibrary = lib);
            return;
          }
          Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => SharedLibraryBooksScreen(
                libraryId: lib.id,
                libraryName: lib.name,
                librarySummary: lib,
              ),
            ),
          );
        },
      ),
    );
  }
}
