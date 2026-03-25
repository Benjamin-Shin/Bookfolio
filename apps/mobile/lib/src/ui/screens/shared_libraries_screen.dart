import 'package:bookfolio_mobile/src/models/shared_library_models.dart';
import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/ui/screens/shared_library_books_screen.dart';
import 'package:bookfolio_mobile/src/ui/widgets/book_grid_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

/// 참여 중인 공동서재 목록(내 서재와 같은 그리드·그라데이션 배경).
///
/// History:
/// - 2026-03-25: 앱바·그리드 카드를 `LibraryScreen` 스타일에 맞춤
class SharedLibrariesScreen extends StatefulWidget {
  const SharedLibrariesScreen({super.key});

  @override
  State<SharedLibrariesScreen> createState() => _SharedLibrariesScreenState();
}

class _SharedLibrariesScreenState extends State<SharedLibrariesScreen> {
  final BookfolioApi _api = BookfolioApi();
  List<SharedLibrarySummary> _items = const [];
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

  String _roleLabel(String myRole) {
    return myRole == 'owner' ? '소유자' : '멤버';
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SvgPicture.asset(
              'assets/brand/bookfolio_logo.svg',
              width: 26,
              height: 26,
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Text.rich(
                TextSpan(
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF3E342C),
                      ),
                  children: const [
                    TextSpan(text: '북폴리오'),
                    TextSpan(
                      text: ' - ',
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF7A6A5C),
                      ),
                    ),
                    TextSpan(text: '공동서재'),
                  ],
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
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
                        Material(
                          color: colorScheme.errorContainer.withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text(
                              _error!,
                              style: TextStyle(color: colorScheme.onErrorContainer, fontSize: 14),
                            ),
                          ),
                        ),
                      ],
                    )
                  : _items.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(24),
                          children: [
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF0E6DA),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFFD9CBB8)),
                              ),
                              child: Column(
                                children: [
                                  Icon(
                                    Icons.groups_2_outlined,
                                    size: 48,
                                    color: colorScheme.primary.withValues(alpha: 0.85),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    '참여 중인 공동서재가 없어요',
                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF4E4034),
                                        ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    '웹에서 서재를 만든 뒤 아래로 당겨 새로고침하세요.',
                                    textAlign: TextAlign.center,
                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          color: const Color(0xFF6B5B4D),
                                          height: 1.35,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        )
                      : CustomScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          slivers: [
                            SliverToBoxAdapter(
                              child: Padding(
                                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                                child: Text(
                                  '총 ${_items.length}곳',
                                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                        color: const Color(0xFF5C4A3A),
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                              ),
                            ),
                            SliverPadding(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                              sliver: SliverLayoutBuilder(
                                builder: (context, constraints) {
                                  final width = constraints.crossAxisExtent;
                                  final columns = width >= 520 ? 3 : 2;
                                  return SliverGrid(
                                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: columns,
                                      mainAxisSpacing: 12,
                                      crossAxisSpacing: 12,
                                      childAspectRatio: bookGridCardAspectRatio(columns),
                                    ),
                                    delegate: SliverChildBuilderDelegate(
                                      (context, i) {
                                        final lib = _items[i];
                                        final meta = '${lib.kindLabel} · ${_roleLabel(lib.myRole)}';
                                        return BookGridCard(
                                          title: lib.name,
                                          authorsLine: meta,
                                          coverUrl: null,
                                          gradientSeedA: lib.id,
                                          gradientSeedB: lib.name,
                                          onTap: () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute<void>(
                                                builder: (_) => SharedLibraryBooksScreen(
                                                  libraryId: lib.id,
                                                  libraryName: lib.name,
                                                ),
                                              ),
                                            );
                                          },
                                        );
                                      },
                                      childCount: _items.length,
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
        ),
      ),
    );
  }
}
