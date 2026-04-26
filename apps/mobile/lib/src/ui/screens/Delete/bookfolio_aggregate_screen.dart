import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/widgets/bookfolio_aggregate_widgets.dart';
import 'package:seogadam_mobile/src/ui/layout/main_hub_top_nav.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 서가담 집계: 회원 순위·인기 소장 도서 TOP10.
///
/// History:
/// - 2026-04-07: 앱바 제목·설명 카피 서가담화
/// - 2026-04-05: 집계 카드 위젯을 `bookfolio_aggregate_widgets.dart`로 분리
/// - 2026-04-05: 쉘 탭용 하단 패딩을 `bookfolioShellTabScrollPadding`로 정렬(FAB 제거)
/// - 2026-04-02: `embeddedInShell` — 메인 쉘 탭에서 앱바·허브 바 제외
/// - 2026-03-28: 신규 (`GET /api/me/stats/bookfolio-aggregate`)
class BookfolioAggregateScreen extends StatefulWidget {
  const BookfolioAggregateScreen({super.key, this.embeddedInShell = false});

  final bool embeddedInShell;

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
    final list = ListView(
      physics: widget.embeddedInShell ? const AlwaysScrollableScrollPhysics() : null,
      padding: widget.embeddedInShell
          ? bookfolioShellTabScrollPadding(context)
          : bookfolioMobileScrollPadding(context),
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
          bookfolioAggregateSectionTitle(theme, '소장 건수 순위'),
          BookfolioMemberLeaderboardCard(data: _mapSection(_payload!['ownedBooks']), unit: '권'),
          bookfolioAggregateSectionTitle(theme, '완독 순위'),
          BookfolioMemberLeaderboardCard(data: _mapSection(_payload!['completedBooks']), unit: '권'),
          bookfolioAggregateSectionTitle(theme, '소장 책 순위'),
          BookfolioPopularBooksSection(raw: _payload!['popularOwnedBooks']),
          bookfolioAggregateSectionTitle(theme, '포인트 순위'),
          BookfolioMemberLeaderboardCard(data: _mapSection(_payload!['points']), unit: 'P'),
        ],
      ],
    );

    if (widget.embeddedInShell) {
      return SizedBox.expand(
        child: RefreshIndicator(
          onRefresh: _load,
          child: list,
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('서가담 집계')),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const MainHubTopNavBar(current: MainHubTab.aggregate),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _load,
              child: list,
            ),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic>? _mapSection(dynamic v) =>
      v is Map<String, dynamic> ? v : null;
}
