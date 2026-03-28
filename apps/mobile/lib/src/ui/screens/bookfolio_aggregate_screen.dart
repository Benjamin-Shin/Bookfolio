import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:bookfolio_mobile/src/ui/widgets/main_hub_top_nav.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 북폴리오 집계: 회원 순위·인기 소장 도서 TOP10.
///
/// History:
/// - 2026-03-28: 신규 (`GET /api/me/stats/bookfolio-aggregate`)
class BookfolioAggregateScreen extends StatefulWidget {
  const BookfolioAggregateScreen({super.key});

  @override
  State<BookfolioAggregateScreen> createState() => _BookfolioAggregateScreenState();
}

class _BookfolioAggregateScreenState extends State<BookfolioAggregateScreen> {
  Map<String, dynamic>? _payload;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final api = context.read<LibraryController>().api;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await api.fetchBookfolioAggregate(top: 10);
      if (!mounted) return;
      setState(() {
        _payload = data;
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
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('북폴리오 집계')),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const MainHubTopNavBar(current: MainHubTab.aggregate),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: bookfolioMobileScrollPadding(context),
                children: [
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
                    ),
                  if (_loading)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  else if (_payload != null) ...[
                    _sectionTitle(theme, '소장 건수 순위'),
                    _MemberLeaderboardCard(data: _mapSection(_payload!['ownedBooks']), unit: '권'),
                    _sectionTitle(theme, '완독 순위'),
                    _MemberLeaderboardCard(data: _mapSection(_payload!['completedBooks']), unit: '권'),
                    _sectionTitle(theme, '소장 책 순위'),
                    _PopularBooksSection(raw: _payload!['popularOwnedBooks']),
                    _sectionTitle(theme, '포인트 순위'),
                    _MemberLeaderboardCard(data: _mapSection(_payload!['points']), unit: 'P'),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(ThemeData theme, String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 8),
      child: Text(title, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
    );
  }

  Map<String, dynamic>? _mapSection(dynamic v) =>
      v is Map<String, dynamic> ? v : null;
}

class _MemberLeaderboardCard extends StatelessWidget {
  const _MemberLeaderboardCard({required this.data, required this.unit});

  final Map<String, dynamic>? data;
  final String unit;

  @override
  Widget build(BuildContext context) {
    if (data == null) {
      return const Text('데이터 없음');
    }
    final top = data!['top'];
    final me = data!['me'];
    if (top is! List) {
      return const Text('데이터 없음');
    }
    final meMap = me is Map<String, dynamic> ? me : <String, dynamic>{};
    final rank = meMap['rank'];
    final count = meMap['count'];
    final total = meMap['totalRankedUsers'];
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (rank != null)
              Text('내 순위: $rank위 · $count$unit (집계 대상 $total명)')
            else
              Text('내 순위: 아직 집계에 없음 · $count$unit (집계 대상 ${total ?? 0}명)'),
            const SizedBox(height: 8),
            ...top.take(10).map<Widget>((row) {
              final m = row as Map<String, dynamic>;
              final name = (m['displayName'] as String?)?.trim();
              final c = m['count'];
              return ListTile(
                dense: true,
                title: Text(name == null || name.isEmpty ? '사용자' : name),
                trailing: Text('$c$unit'),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _PopularBooksSection extends StatelessWidget {
  const _PopularBooksSection({required this.raw});

  final dynamic raw;

  @override
  Widget build(BuildContext context) {
    if (raw is! Map<String, dynamic>) {
      return const Text('데이터 없음');
    }
    final top = raw['top'];
    if (top is! List || top.isEmpty) {
      return const Text('아직 표시할 데이터가 없습니다.');
    }
    return Column(
      children: top.take(10).map<Widget>((e) {
        final m = e as Map<String, dynamic>;
        final title = (m['title'] as String?) ?? '';
        final cover = m['coverUrl'] as String?;
        final n = m['ownerCount'];
        final owners = n is int ? n : (n is num ? n.toInt() : 0);
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ListTile(
            leading: SizedBox(
              width: 48,
              height: 72,
              child: cover != null && cover.isNotEmpty
                  ? Image.network(cover, fit: BoxFit.cover)
                  : Container(
                      color: Colors.grey.shade300,
                      alignment: Alignment.center,
                      child: const Icon(Icons.menu_book_outlined, size: 22),
                    ),
            ),
            title: Text(title, maxLines: 2, overflow: TextOverflow.ellipsis),
            subtitle: Text('$owners명 소장 등록'),
          ),
        );
      }).toList(),
    );
  }
}
