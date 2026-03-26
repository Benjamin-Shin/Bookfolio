import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:bookfolio_mobile/src/ui/widgets/main_hub_top_nav.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';

/// 완독·소장 리더보드와 독서 이벤트 캘린더.
///
/// History:
/// - 2026-03-26: `MainHubTopNavBar` 추가
/// - 2026-03-26: 신규
class MyStatsScreen extends StatefulWidget {
  const MyStatsScreen({super.key});

  @override
  State<MyStatsScreen> createState() => _MyStatsScreenState();
}

class _MyStatsScreenState extends State<MyStatsScreen> {
  DateTime _focusedDay = DateTime.now();
  Map<String, int> _calendar = {};
  bool _calLoading = false;
  Map<String, dynamic>? _completedLb;
  Map<String, dynamic>? _ownedLb;
  bool _lbLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAll());
  }

  Future<void> _loadAll() async {
    final api = context.read<LibraryController>().api;
    setState(() {
      _lbLoading = true;
      _error = null;
    });
    try {
      final c = await api.fetchReadingLeaderboard('completed');
      final o = await api.fetchReadingLeaderboard('owned');
      if (!mounted) return;
      setState(() {
        _completedLb = c;
        _ownedLb = o;
        _lbLoading = false;
      });
      await _loadCalendarMonth();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _lbLoading = false;
      });
    }
  }

  Future<void> _loadCalendarMonth() async {
    final api = context.read<LibraryController>().api;
    final start = DateTime(_focusedDay.year, _focusedDay.month, 1);
    final end = DateTime(_focusedDay.year, _focusedDay.month + 1, 0);
    String iso(DateTime d) =>
        '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    setState(() => _calLoading = true);
    try {
      final m = await api.fetchReadingEventsCalendar(iso(start), iso(end));
      if (!mounted) return;
      setState(() {
        _calendar = m;
        _calLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _calLoading = false;
      });
    }
  }

  int? _dayCount(DateTime day) {
    final key =
        '${day.year.toString().padLeft(4, '0')}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
    return _calendar[key];
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('내 통계'),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const MainHubTopNavBar(current: MainHubTab.stats),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadAll,
              child: ListView(
                padding: bookfolioMobileScrollPadding(context),
                children: [
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
                    ),
                  Text('완독 권수 순위', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  if (_lbLoading)
                    const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
                  else
                    _LeaderboardBlock(data: _completedLb),
                  const SizedBox(height: 24),
                  Text('소장 권수 순위', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  if (_lbLoading)
                    const SizedBox.shrink()
                  else
                    _LeaderboardBlock(data: _ownedLb),
                  const SizedBox(height: 24),
                  Text('독서 이벤트 캘린더', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  if (_calLoading)
                    const Center(child: CircularProgressIndicator())
                  else
                    TableCalendar<void>(
                      firstDay: DateTime.utc(2020, 1, 1),
                      lastDay: DateTime.utc(2035, 12, 31),
                      focusedDay: _focusedDay,
                      calendarFormat: CalendarFormat.month,
                      eventLoader: (day) {
                        final n = _dayCount(day);
                        if (n == null || n < 1) return const [];
                        return List<void>.filled(n, null);
                      },
                      onPageChanged: (focused) {
                        setState(() => _focusedDay = focused);
                        _loadCalendarMonth();
                      },
                      onDaySelected: (_, focused) {
                        setState(() => _focusedDay = focused);
                      },
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LeaderboardBlock extends StatelessWidget {
  const _LeaderboardBlock({required this.data});

  final Map<String, dynamic>? data;

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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (rank != null)
          Text('내 순위: $rank위 · $count권 (집계 대상 $total명)')
        else
          Text('내 순위: 아직 집계에 없음 · $count권 (집계 대상 ${total ?? 0}명)'),
        const SizedBox(height: 8),
        ...top.take(10).map<Widget>((row) {
          final m = row as Map<String, dynamic>;
          final name = (m['displayName'] as String?)?.trim();
          final c = m['count'];
          return ListTile(
            dense: true,
            title: Text(name == null || name.isEmpty ? '사용자' : name),
            trailing: Text('$c권'),
          );
        }),
      ],
    );
  }
}
