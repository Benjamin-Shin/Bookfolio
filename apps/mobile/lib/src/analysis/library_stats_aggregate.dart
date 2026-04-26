import 'package:seogadam_mobile/src/analysis/reading_tendency_analysis.dart';
import 'package:seogadam_mobile/src/models/book_models.dart';

/// [MyStatsScreen] 등에 넘길 서가 통계 묶음.
class LibraryStatsAggregate {
  const LibraryStatsAggregate({
    required this.tendency,
    required this.monthlyFinishedCounts,
    required this.monthShortLabels,
    required this.totalBooks,
    required this.thisMonthFinishedProxy,
    required this.lastMonthFinishedProxy,
    required this.totalPagesApprox,
    required this.activityStreakDays,
    required this.avgDaysToFinishCompleted,
    required this.medianPagesPerDayCompleted,
    required this.genreCounts,
    required this.statusCounts,
  });

  final ReadingTendencySnapshot tendency;

  /// 최근 6개월(오래된 달 → 최근 달) 완독 권수 근사(`updatedAt` 월 기준).
  final List<int> monthlyFinishedCounts;
  final List<String> monthShortLabels;

  final int totalBooks;
  final int thisMonthFinishedProxy;
  final int lastMonthFinishedProxy;
  final int totalPagesApprox;
  final int activityStreakDays;
  final double avgDaysToFinishCompleted;
  final double medianPagesPerDayCompleted;

  /// 상위 장르 슬러그 → 권수 (내림차순 정렬됨).
  final List<MapEntry<String, int>> genreCounts;

  /// 읽기 상태별 권수.
  final Map<ReadingStatus, int> statusCounts;
}

DateTime? _parse(String? raw) {
  if (raw == null || raw.isEmpty) return null;
  return DateTime.tryParse(raw);
}

int? _pages(UserBook b) {
  return b.effectiveTotalPages ??
      (b.currentPage != null && b.currentPage! > 0 ? b.currentPage : null);
}

/// 오늘 또는 어제 활동이 있을 때만, 역방향으로 연속 일수를 셉니다(기록일 기준 근사).
int _activityStreakDays(List<UserBook> books, DateTime now) {
  final dayKeys = <int>{};
  for (final b in books) {
    for (final raw in [b.updatedAt, b.createdAt]) {
      final dt = _parse(raw);
      if (dt == null) continue;
      dayKeys.add(DateTime(dt.year, dt.month, dt.day).millisecondsSinceEpoch);
    }
  }
  if (dayKeys.isEmpty) return 0;
  var anchor = DateTime(now.year, now.month, now.day);
  if (!dayKeys.contains(anchor.millisecondsSinceEpoch)) {
    anchor = anchor.subtract(const Duration(days: 1));
    if (!dayKeys.contains(anchor.millisecondsSinceEpoch)) {
      return 0;
    }
  }
  var streak = 0;
  while (dayKeys.contains(anchor.millisecondsSinceEpoch)) {
    streak++;
    anchor = anchor.subtract(const Duration(days: 1));
  }
  return streak.clamp(0, 9999);
}

LibraryStatsAggregate computeLibraryStatsAggregate(List<UserBook> books) {
  final now = DateTime.now();
  final tendency = computeReadingTendency(books);

  final monthStarts = List.generate(6, (i) {
    final d = DateTime(now.year, now.month, 1);
    return DateTime(d.year, d.month - (5 - i), 1);
  });
  final monthLabels = monthStarts
      .map((d) => '${d.month}월')
      .toList(growable: false);
  final monthlyFinished = List<int>.filled(6, 0);

  var thisM = 0;
  var lastM = 0;

  final genreMap = <String, int>{};
  final statusMap = <ReadingStatus, int>{};

  var totalPages = 0;
  final finishDurations = <double>[];
  final ppdList = <double>[];

  for (final b in books) {
    statusMap[b.readingStatus] = (statusMap[b.readingStatus] ?? 0) + 1;
    for (final g in b.genreSlugs) {
      final t = g.trim();
      if (t.isEmpty) continue;
      genreMap[t] = (genreMap[t] ?? 0) + 1;
    }

    switch (b.readingStatus) {
      case ReadingStatus.completed:
        final p = _pages(b) ?? 0;
        totalPages += p;
        final c = _parse(b.createdAt);
        final u = _parse(b.updatedAt) ?? c;
        if (c != null && u != null) {
          var days = u.difference(c).inDays + 1;
          if (days < 1) days = 1;
          finishDurations.add(days.toDouble());
          if (p >= 30) ppdList.add(p / days);
        }
        final up = _parse(b.updatedAt);
        if (up != null) {
          for (var i = 0; i < 6; i++) {
            final start = monthStarts[i];
            final end = DateTime(start.year, start.month + 1, 1);
            if (!up.isBefore(start) && up.isBefore(end)) {
              monthlyFinished[i]++;
              break;
            }
          }
          if (up.year == now.year && up.month == now.month) {
            thisM++;
          }
          final lm = DateTime(now.year, now.month - 1, 1);
          final lme = DateTime(now.year, now.month, 1);
          if (!up.isBefore(lm) && up.isBefore(lme)) {
            lastM++;
          }
        }
        break;
      case ReadingStatus.reading:
        totalPages += (b.currentPage ?? 0).clamp(0, 1 << 20);
        break;
      default:
        break;
    }
  }

  ppdList.sort();
  final medianPpd = ppdList.isEmpty
      ? 0.0
      : ppdList[ppdList.length ~/ 2];
  final avgFinish = finishDurations.isEmpty
      ? 0.0
      : finishDurations.reduce((a, b) => a + b) / finishDurations.length;

  final genreTop = genreMap.entries.toList()
    ..sort((a, b) => b.value.compareTo(a.value));

  return LibraryStatsAggregate(
    tendency: tendency,
    monthlyFinishedCounts: monthlyFinished,
    monthShortLabels: monthLabels,
    totalBooks: books.length,
    thisMonthFinishedProxy: thisM,
    lastMonthFinishedProxy: lastM,
    totalPagesApprox: totalPages,
    activityStreakDays: _activityStreakDays(books, now),
    avgDaysToFinishCompleted: avgFinish,
    medianPagesPerDayCompleted: medianPpd,
    genreCounts: genreTop,
    statusCounts: statusMap,
  );
}
