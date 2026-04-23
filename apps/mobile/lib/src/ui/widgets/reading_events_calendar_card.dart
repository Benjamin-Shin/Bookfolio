import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';

/// 독서 이벤트(완독 등) 월별 캘린더 — 홈 등에서 재사용.
///
/// History:
/// - 2026-04-12: `LibraryScreen` 요약 탭에서 분리·홈 배치용 신규
class ReadingEventsCalendarCard extends StatefulWidget {
  const ReadingEventsCalendarCard({super.key});

  @override
  State<ReadingEventsCalendarCard> createState() => ReadingEventsCalendarCardState();
}

class ReadingEventsCalendarCardState extends State<ReadingEventsCalendarCard> {
  Map<String, int> _dayCounts = {};
  Map<String, String?> _dayFirstCover = {};
  DateTime _calFocused = DateTime.now();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _loadCalendarForFocusedMonth(context.read<LibraryController>().api);
    });
  }

  /// 홈 `RefreshIndicator` 등 부모 새로고침 시 현재 포커스 월을 다시 불러옵니다.
  void reload() {
    if (!mounted) return;
    _loadCalendarForFocusedMonth(context.read<LibraryController>().api);
  }

  String _ymd(DateTime d) {
    return '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  Future<void> _loadCalendarForFocusedMonth(BookfolioApi api) async {
    final start = DateTime(_calFocused.year, _calFocused.month, 1);
    final end = DateTime(_calFocused.year, _calFocused.month + 1, 0);
    final from = _ymd(start);
    final to = _ymd(end);
    try {
      final cal = await api.fetchReadingEventsCalendar(from, to);
      if (!mounted) return;
      final withEvents = cal.entries.where((e) => e.value > 0).map((e) => e.key).toList();
      const batch = 8;
      final covers = <String, String?>{};
      for (var i = 0; i < withEvents.length; i += batch) {
        final chunk = withEvents.skip(i).take(batch);
        final rows = await Future.wait(
          chunk.map((day) async {
            try {
              final list = await api.fetchReadingEventsByDay(day);
              String? url;
              for (final r in list) {
                final u = r.coverUrl;
                if (u != null && u.isNotEmpty) {
                  url = u;
                  break;
                }
              }
              return MapEntry(day, url);
            } catch (_) {
              return MapEntry(day, null);
            }
          }),
        );
        for (final e in rows) {
          covers[e.key] = e.value;
        }
      }
      if (!mounted) return;
      setState(() {
        _dayCounts = cal;
        _dayFirstCover = covers;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _dayCounts = {};
        _dayFirstCover = {};
      });
    }
  }

  int? _dayEventCount(DateTime day) => _dayCounts[_ymd(day)];

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;
    final api = context.read<LibraryController>().api;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
          child: Text(
            '독서 캘린더',
            style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(0, 0, 0, 0),
          child: Material(
            color: colorScheme.surfaceContainerHigh.withValues(alpha: 0.55),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: TableCalendar<void>(
                firstDay: DateTime.utc(2020, 1, 1),
                lastDay: DateTime.utc(2035, 12, 31),
                focusedDay: _calFocused,
                locale: 'ko_KR',
                calendarFormat: CalendarFormat.month,
                availableGestures: AvailableGestures.horizontalSwipe,
                eventLoader: (day) {
                  final n = _dayEventCount(day);
                  if (n == null || n < 1) return const [];
                  return List<void>.filled(n, null);
                },
                onPageChanged: (focused) {
                  setState(() => _calFocused = focused);
                  _loadCalendarForFocusedMonth(api);
                },
                calendarStyle: CalendarStyle(
                  outsideDaysVisible: true,
                  cellMargin: const EdgeInsets.all(2),
                  defaultDecoration: BoxDecoration(borderRadius: BorderRadius.circular(8)),
                ),
                calendarBuilders: CalendarBuilders(
                  defaultBuilder: (ctx, day, fd) => _calendarCell(ctx, day, fd, muted: false),
                  todayBuilder: (ctx, day, fd) => _calendarCell(ctx, day, fd, muted: false, isToday: true),
                  outsideBuilder: (ctx, day, fd) => _calendarCell(ctx, day, fd, muted: true),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _calendarCell(
    BuildContext context,
    DateTime day,
    DateTime focusedDay, {
    required bool muted,
    bool isToday = false,
  }) {
    final scheme = Theme.of(context).colorScheme;
    final ymd = _ymd(day);
    final coverRaw = _dayFirstCover[ymd];
    final cover = coverRaw != null ? resolveCoverImageUrl(coverRaw) : null;
    final n = _dayEventCount(day) ?? 0;
    final base = BoxDecoration(
      borderRadius: BorderRadius.circular(8),
      border: Border.all(
        color: isToday ? scheme.primary : scheme.outlineVariant.withValues(alpha: muted ? 0.35 : 0.65),
        width: isToday ? 1.4 : 0.8,
      ),
    );
    if (cover != null && n > 0) {
      return Container(
        margin: const EdgeInsets.all(2),
        decoration: base,
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              cover,
              fit: BoxFit.cover,
              headers: kCoverImageRequestHeaders,
              errorBuilder: (_, __, ___) => ColoredBox(color: scheme.surfaceContainerHighest),
            ),
            if (n > 1)
              Positioned(
                right: 2,
                top: 2,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '$n',
                    style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
          ],
        ),
      );
    }
    final labelStyle = Theme.of(context).textTheme.labelMedium?.copyWith(
          color: muted ? scheme.onSurfaceVariant.withValues(alpha: 0.45) : scheme.onSurface,
          fontWeight: isToday ? FontWeight.w800 : FontWeight.w500,
        );
    return Container(
      margin: const EdgeInsets.all(2),
      decoration: base,
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('${day.day}', style: labelStyle),
          if (n > 0)
            Container(
              margin: const EdgeInsets.only(top: 2),
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: scheme.primaryContainer.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '$n',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: scheme.onPrimaryContainer,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
