import 'package:bookfolio_mobile/src/models/shared_library_models.dart';
import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/ui/screens/shared_library_books_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

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

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('공동서재'),
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
                            Text('참여 중인 공동서재가 없습니다. 웹에서 서재를 만든 뒤 다시 당겨 새로고침하세요.'),
                          ],
                        )
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(16),
                          itemCount: _items.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, i) {
                            final lib = _items[i];
                            return Material(
                              color: Colors.white.withValues(alpha: 0.55),
                              borderRadius: BorderRadius.circular(12),
                              child: ListTile(
                                title: Text(lib.name),
                                subtitle: Text(
                                  '${lib.kindLabel} · ${lib.myRole == 'owner' ? '소유자' : '멤버'}',
                                ),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => SharedLibraryBooksScreen(
                                        libraryId: lib.id,
                                        libraryName: lib.name,
                                      ),
                                    ),
                                  );
                                },
                              ),
                            );
                          },
                        ),
        ),
      ),
    );
  }
}
