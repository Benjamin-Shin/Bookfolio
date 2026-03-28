import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';

/// 개인 독서 이벤트 캘린더(회원 순위는 「북폴리오 집계」).
///
/// History:
/// - 2026-03-28: 완독·소장 리더보드 제거 — `BookfolioAggregateScreen`으로 이전; 허브 바 제거(서랍·프로필 등에서 진입)
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
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadCalendarMonth());
  }

  Future<void> _loadCalendarMonth() async {
    final api = context.read<LibraryController>().api;
    final start = DateTime(_focusedDay.year, _focusedDay.month, 1);
    final end = DateTime(_focusedDay.year, _focusedDay.month + 1, 0);
    String iso(DateTime d) =>
        '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    setState(() {
      _calLoading = true;
      _error = null;
    });
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
        _error = e.toString();
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
      body: RefreshIndicator(
        onRefresh: _loadCalendarMonth,
        child: ListView(
          padding: bookfolioMobileScrollPadding(context),
          children: [
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
              ),
            Text(
              '회원 순위·인기 소장 도서는 상단 메뉴 「북폴리오 집계」에서 확인할 수 있습니다.',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
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
    );
  }
}
