import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:provider/provider.dart';
import 'package:seogadam_mobile/src/analysis/library_stats_aggregate.dart';
import 'package:seogadam_mobile/src/analysis/reading_tendency_analysis.dart';
import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';

class MyStatsScreen extends StatefulWidget {
  const MyStatsScreen({super.key, this.embeddedInShell = false});

  final bool embeddedInShell;

  @override
  State<MyStatsScreen> createState() => _MyStatsScreenState();
}

class _MyStatsScreenState extends State<MyStatsScreen> {
  Future<LibraryStatsAggregate>? _aggregateFuture;

  Future<LibraryStatsAggregate> _loadAggregate() async {
    final auth = context.read<AuthController>();
    if (!auth.isAuthenticated) {
      throw StateError('Unauthorized');
    }
    final api = BookfolioApi()..accessToken = () => auth.session?.accessToken;
    final books = await api.fetchAllUserBooks();
    return computeLibraryStatsAggregate(books);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = context.watch<AuthController>();
    if (!auth.isAuthenticated) {
      _aggregateFuture = null;
      return;
    }
    _aggregateFuture ??= _loadAggregate();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    if (!auth.isAuthenticated) {
      final body = Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            '내 서가 분석은 로그인 후 이용할 수 있어요.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
        ),
      );
      if (widget.embeddedInShell) {
        return body;
      }
      return Scaffold(
        appBar: AppBar(title: const Text('내 서가 분석')),
        body: body,
      );
    }

    final future = _aggregateFuture ??= _loadAggregate();

    final list = FutureBuilder<LibraryStatsAggregate>(
      future: future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Padding(
            padding: EdgeInsets.all(48),
            child: Center(child: CircularProgressIndicator()),
          );
        }
        if (snap.hasError) {
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: Text(
                '통계를 불러오지 못했습니다.\n${snap.error}',
                textAlign: TextAlign.center,
              ),
            ),
          );
        }
        final agg = snap.data!;
        return ListView(
          physics: widget.embeddedInShell
              ? const AlwaysScrollableScrollPhysics()
              : null,
          padding: widget.embeddedInShell
              ? bookfolioShellTabScrollPadding(context)
              : bookfolioMobileScrollPadding(context),
          children: [
            _OverviewCard(aggregate: agg),
            const SizedBox(height: 16),
            _MonthlyChartCard(aggregate: agg),
            const SizedBox(height: 16),
            _AnalysisRow(aggregate: agg),
            const SizedBox(height: 16),
            _ReadingPersonaCard(snapshot: agg.tendency),
            const SizedBox(height: 16),
            _FiveIndicatorsCard(snapshot: agg.tendency),
            const SizedBox(height: 16),
            _GrowthMetricsCard(aggregate: agg),
          ],
        );
      },
    );

    if (widget.embeddedInShell) {
      return SizedBox.expand(child: list);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('내 서가 분석'),
        actions: [
          IconButton(
            tooltip: '새로고침',
            onPressed: () {
              setState(() {
                _aggregateFuture = _loadAggregate();
              });
            },
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: list,
    );
  }
}

class _OverviewCard extends StatelessWidget {
  const _OverviewCard({required this.aggregate});

  final LibraryStatsAggregate aggregate;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final now = DateTime.now();
    final period = DateFormat('yyyy년 M월', 'ko_KR').format(now);
    final nf = NumberFormat.decimalPattern('ko');
    final delta =
        aggregate.thisMonthFinishedProxy - aggregate.lastMonthFinishedProxy;
    final deltaText = delta == 0
        ? '지난 달과 동일'
        : (delta > 0 ? '지난 달 대비 +$delta권' : '지난 달 대비 $delta권');

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFF0A6239), Color(0xFF0E7A46)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                '한눈에 보는 독서 요약',
                style: tt.labelLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.95),
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  period,
                  style: tt.labelSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _OverviewMetric(
                  icon: Icons.menu_book_rounded,
                  label: '총 독서권수',
                  value: '${aggregate.totalBooks}권',
                  caption: '전체 기록',
                ),
              ),
              Expanded(
                child: _OverviewMetric(
                  icon: Icons.calendar_month_outlined,
                  label: '이번 달 완독',
                  value: '${aggregate.thisMonthFinishedProxy}권',
                  caption: deltaText,
                ),
              ),
              Expanded(
                child: _OverviewMetric(
                  icon: Icons.sticky_note_2_outlined,
                  label: '누적 페이지',
                  value: '${nf.format(aggregate.totalPagesApprox)}p',
                  caption: '완독+진행분',
                ),
              ),
              Expanded(
                child: _OverviewMetric(
                  icon: Icons.local_fire_department_outlined,
                  label: '연속 활동일',
                  value: '${aggregate.activityStreakDays}일',
                  caption: '기록 기준',
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            _overviewHint(aggregate),
            style: tt.labelMedium?.copyWith(
              color: scheme.onPrimary.withValues(alpha: 0.88),
            ),
          ),
        ],
      ),
    );
  }

  String _overviewHint(LibraryStatsAggregate a) {
    final c = a.tendency.completionRatePercent;
    if (a.totalBooks == 0) return '책을 추가하면 요약이 채워져요.';
    if (c >= 45) return '완독 비율이 좋아요. 지금 페이스를 이어가 보세요.';
    if (c >= 20) return '읽다 멈춘 책도 괜찮아요. 한 권씩 끝까지 가볼까요?';
    return '서가에 책이 쌓이고 있어요. 첫 완독을 노려보세요!';
  }
}

class _OverviewMetric extends StatelessWidget {
  const _OverviewMetric({
    required this.icon,
    required this.label,
    required this.value,
    required this.caption,
  });

  final IconData icon;
  final String label;
  final String value;
  final String caption;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: Colors.white.withValues(alpha: 0.9)),
          const SizedBox(height: 7),
          Text(
            label,
            style: tt.labelSmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.86),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: tt.titleLarge?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            caption,
            style: tt.labelSmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.74),
            ),
          ),
        ],
      ),
    );
  }
}

class _MonthlyChartCard extends StatelessWidget {
  const _MonthlyChartCard({required this.aggregate});

  final LibraryStatsAggregate aggregate;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final values = aggregate.monthlyFinishedCounts;
    final maxV = values.isEmpty ? 1 : values.reduce(math.max).clamp(1, 999);

    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '월별 완독 권수',
            style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            '완독으로 표시된 책의 수정 시각(근사)을 기준으로 집계했어요.',
            style: tt.labelSmall?.copyWith(color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 190,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(
                    5,
                    (index) {
                      final axis = maxV - ((maxV / 4) * index).round();
                      return Text(
                        '$axis',
                        style: tt.labelSmall
                            ?.copyWith(color: scheme.onSurfaceVariant),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      return CustomPaint(
                        painter: _LineChartPainter(
                          values: values.map((e) => e.toDouble()).toList(),
                          labels: aggregate.monthShortLabels,
                          color: const Color(0xFF1F7A44),
                          muted: scheme.outlineVariant,
                          textColor: scheme.onSurfaceVariant,
                          maxY: maxV.toDouble(),
                        ),
                        child: const SizedBox.expand(),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LineChartPainter extends CustomPainter {
  const _LineChartPainter({
    required this.values,
    required this.labels,
    required this.color,
    required this.muted,
    required this.textColor,
    required this.maxY,
  });

  final List<double> values;
  final List<String> labels;
  final Color color;
  final Color muted;
  final Color textColor;
  final double maxY;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty || labels.isEmpty) return;

    const bottomLabelArea = 28.0;
    final chartHeight = size.height - bottomLabelArea;
    final maxValue = maxY.clamp(1.0, 999.0);
    final rowPaint = Paint()
      ..color = muted.withValues(alpha: 0.45)
      ..strokeWidth = 1;

    for (var i = 0; i < 5; i++) {
      final y = chartHeight * (i / 4);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), rowPaint);
    }

    final points = <Offset>[];
    final gap = values.length == 1 ? 0.0 : size.width / (values.length - 1);
    for (var i = 0; i < values.length; i++) {
      final x = gap * i;
      final y = chartHeight - ((values[i] / maxValue) * chartHeight);
      points.add(Offset(x, y));
    }

    final areaPath = Path()..moveTo(points.first.dx, chartHeight);
    for (final p in points) {
      areaPath.lineTo(p.dx, p.dy);
    }
    areaPath
      ..lineTo(points.last.dx, chartHeight)
      ..close();
    canvas.drawPath(
      areaPath,
      Paint()
        ..color = color.withValues(alpha: 0.16)
        ..style = PaintingStyle.fill,
    );

    final line = Paint()
      ..color = color
      ..strokeWidth = 2.2
      ..style = PaintingStyle.stroke;
    final linePath = Path()..moveTo(points.first.dx, points.first.dy);
    for (var i = 1; i < points.length; i++) {
      linePath.lineTo(points[i].dx, points[i].dy);
    }
    canvas.drawPath(linePath, line);

    final dotPaint = Paint()..color = color;
    for (final p in points) {
      canvas.drawCircle(p, 3.6, dotPaint);
    }

    for (var i = 0; i < labels.length && i < points.length; i++) {
      final tp = TextPainter(
        text: TextSpan(
          text: labels[i],
          style: TextStyle(
            color: textColor,
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      final dx = (points[i].dx - (tp.width / 2))
          .clamp(0.0, math.max(0.0, size.width - tp.width))
          .toDouble();
      tp.paint(canvas, Offset(dx, chartHeight + 8));
    }
  }

  @override
  bool shouldRepaint(covariant _LineChartPainter oldDelegate) {
    return oldDelegate.values != values ||
        oldDelegate.labels != labels ||
        oldDelegate.color != color ||
        oldDelegate.muted != muted ||
        oldDelegate.textColor != textColor ||
        oldDelegate.maxY != maxY;
  }
}

class _AnalysisRow extends StatelessWidget {
  const _AnalysisRow({required this.aggregate});

  final LibraryStatsAggregate aggregate;

  @override
  Widget build(BuildContext context) {
    final genre = _genreDonut(aggregate);
    final status = _statusDonut(aggregate);
    return Row(
      children: [
        Expanded(
          child: _DonutAnalysisCard(
            title: '카테고리 분석',
            subtitle: genre.subtitle,
            values: genre.values,
            labels: genre.labels,
            colors: const [
              Color(0xFF0F7B46),
              Color(0xFF6CBF7D),
              Color(0xFFE8C36A),
              Color(0xFFCFD6D0),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _DonutAnalysisCard(
            title: '독서 상태 비율',
            subtitle: status.subtitle,
            values: status.values,
            labels: status.labels,
            colors: const [
              Color(0xFF0F7B46),
              Color(0xFFAEDAAE),
              Color(0xFFE8C36A),
            ],
          ),
        ),
      ],
    );
  }

  _DonutDerived _genreDonut(LibraryStatsAggregate a) {
    final top = a.genreCounts.take(3).toList();
    if (top.isEmpty) {
      return _DonutDerived(
        values: const [100],
        labels: const ['장르 미등록 100%'],
        subtitle: 'ISBN 조회로 장르가 채워지면\n여기서 비율을 볼 수 있어요.',
      );
    }
    final other = a.genreCounts.skip(3).fold<int>(0, (s, e) => s + e.value);
    final values = <double>[];
    final labels = <String>[];
    for (final e in top) {
      values.add(e.value.toDouble());
      labels.add('${e.key} ${e.value}권');
    }
    if (other > 0) {
      values.add(other.toDouble());
      labels.add('기타 $other권');
    }
    final total = values.fold<double>(0, (x, y) => x + y);
    final pct = total > 0 ? ((top.first.value / total) * 100).round() : 0;
    return _DonutDerived(
      values: values,
      labels: labels,
      subtitle: '${top.first.key} 분야 비중이 $pct%로\n가장 두드러져요.',
    );
  }

  _DonutDerived _statusDonut(LibraryStatsAggregate a) {
    int c(ReadingStatus s) => a.statusCounts[s] ?? 0;
    final reading = c(ReadingStatus.reading);
    final unread = c(ReadingStatus.unread);
    final done = c(ReadingStatus.completed);
    final paused = c(ReadingStatus.paused) + c(ReadingStatus.dropped);
    final values = [reading.toDouble(), unread.toDouble(), done.toDouble()];
    final labels = [
      '읽는 중 $reading권',
      '읽을 예정 $unread권',
      '완독 $done권',
    ];
    if (paused > 0) {
      values.add(paused.toDouble());
      labels.add('멈춤·중단 $paused권');
    }
    if (values.fold<double>(0, (x, y) => x + y) <= 0) {
      values
        ..clear()
        ..add(1);
      labels
        ..clear()
        ..add('상태 미설정');
    }
    final total = a.totalBooks.clamp(1, 1 << 20);
    final donePct = ((done / total) * 100).round();
    return _DonutDerived(
      values: values,
      labels: labels,
      subtitle: '완독 비율 약 $donePct%예요.\n상태를 꾸준히 갱신해 주세요.',
    );
  }
}

class _DonutDerived {
  const _DonutDerived({
    required this.values,
    required this.labels,
    required this.subtitle,
  });

  final List<double> values;
  final List<String> labels;
  final String subtitle;
}

class _DonutAnalysisCard extends StatelessWidget {
  const _DonutAnalysisCard({
    required this.title,
    required this.subtitle,
    required this.values,
    required this.labels,
    required this.colors,
  });

  final String title;
  final String subtitle;
  final List<double> values;
  final List<String> labels;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final scheme = Theme.of(context).colorScheme;
    final safeColors = List<Color>.generate(
      labels.length,
      (i) => i < colors.length ? colors[i] : colors.last,
    );
    return _SurfaceCard(
      padding: const EdgeInsets.fromLTRB(12, 14, 12, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          Center(
            child: SizedBox(
              width: 118,
              height: 118,
              child: CustomPaint(
                painter: _DonutPainter(values: values, colors: safeColors),
                child: const Center(
                  child: Icon(Icons.menu_book_rounded,
                      size: 26, color: Color(0xFF1A6F41)),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          for (var i = 0; i < labels.length && i < safeColors.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 5),
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: safeColors[i],
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      labels[i],
                      style: tt.labelSmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                        height: 1.25,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F6F3),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              subtitle,
              style: tt.labelSmall?.copyWith(height: 1.35),
            ),
          ),
        ],
      ),
    );
  }
}

class _DonutPainter extends CustomPainter {
  const _DonutPainter({
    required this.values,
    required this.colors,
  });

  final List<double> values;
  final List<Color> colors;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty || colors.isEmpty) return;
    final total = values.fold<double>(0, (sum, item) => sum + item);
    if (total <= 0) return;

    final stroke = math.min(size.width, size.height) * 0.22;
    final rect = Offset.zero & size;
    final arc = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.butt;

    var start = -math.pi / 2;
    for (var i = 0; i < values.length && i < colors.length; i++) {
      final sweep = (values[i] / total) * (math.pi * 2);
      arc.color = colors[i];
      canvas.drawArc(rect.deflate(stroke / 2), start, sweep, false, arc);
      start += sweep;
    }
  }

  @override
  bool shouldRepaint(covariant _DonutPainter oldDelegate) {
    return oldDelegate.values != values || oldDelegate.colors != colors;
  }
}

class _ReadingPersonaCard extends StatelessWidget {
  const _ReadingPersonaCard({required this.snapshot});

  final ReadingTendencySnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final scheme = Theme.of(context).colorScheme;
    final p = snapshot.persona;
    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '당신의 독서 성향',
            style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.asset(
                  p.imageAssetPath,
                  width: 148,
                  height: 88,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F0),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: const Text('📚', style: TextStyle(fontSize: 30)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.title,
                      style: tt.titleLarge?.copyWith(
                        color: const Color(0xFF1D7A46),
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      p.description,
                      style: tt.bodySmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [for (final t in p.tags) _TagPill(text: t)],
          ),
        ],
      ),
    );
  }
}

/// 완독률·다양성·속도·지속성·깊이(평균 분량 기반) 5지표.
class _FiveIndicatorsCard extends StatelessWidget {
  const _FiveIndicatorsCard({required this.snapshot});

  final ReadingTendencySnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '핵심 5가지 지표',
            style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            '0~100점 근사치이며, 기록이 많을수록 의미가 커져요.',
            style: tt.labelSmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          _scoreBar(context, '완독률', snapshot.completionRatePercent),
          _scoreBar(context, '다양성', snapshot.diversityScore),
          _scoreBar(context, '속도', snapshot.speedScore),
          _scoreBar(context, '지속성', snapshot.persistenceScore),
          _scoreBar(context, '깊이', snapshot.depthScore),
        ],
      ),
    );
  }

  Widget _scoreBar(BuildContext context, String label, int score) {
    final tt = Theme.of(context).textTheme;
    final scheme = Theme.of(context).colorScheme;
    final s = score.clamp(0, 100);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: tt.labelMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
              Text(
                '$s',
                style: tt.titleSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF1D7A46),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: s / 100,
              minHeight: 8,
              backgroundColor: scheme.surfaceContainerHighest,
              color: const Color(0xFF2F8D55),
            ),
          ),
        ],
      ),
    );
  }
}

class _GrowthMetricsCard extends StatelessWidget {
  const _GrowthMetricsCard({required this.aggregate});

  final LibraryStatsAggregate aggregate;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final t = aggregate.tendency;
    final avgDays = aggregate.avgDaysToFinishCompleted;
    final ppd = aggregate.medianPagesPerDayCompleted;
    final avgDaysText = avgDays <= 0 ? '—' : '${avgDays.toStringAsFixed(1)}일';
    final ppdText = ppd <= 0 ? '—' : '${ppd.toStringAsFixed(0)}p/일';

    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '성장 지표',
            style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _MetricTile(
                  icon: Icons.emoji_events_outlined,
                  label: '완독률',
                  value: '${t.completionRatePercent}%',
                  caption: '등록 권 대비',
                ),
              ),
              Expanded(
                child: _MetricTile(
                  icon: Icons.timer_outlined,
                  label: '평균 완독 기간',
                  value: avgDaysText,
                  caption: '생성~수정일 근사',
                ),
              ),
              Expanded(
                child: _MetricTile(
                  icon: Icons.schedule_outlined,
                  label: '완독 일 평균',
                  value: ppdText,
                  caption: '페이지/일 중앙값',
                ),
              ),
              Expanded(
                child: _MetricTile(
                  icon: Icons.track_changes_outlined,
                  label: '연속 활동',
                  value: '${aggregate.activityStreakDays}일',
                  caption: '기록일 기준',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.caption,
  });

  final IconData icon;
  final String label;
  final String value;
  final String caption;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: const Color(0xFF357F53)),
          const SizedBox(height: 6),
          Text(
            label,
            style: tt.labelSmall?.copyWith(color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 2),
          Text(
            caption,
            style: tt.labelSmall?.copyWith(
              color: scheme.onSurfaceVariant,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

class _TagPill extends StatelessWidget {
  const _TagPill({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF4ED),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: tt.labelSmall?.copyWith(
          color: const Color(0xFF2F7E4E),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _SurfaceCard extends StatelessWidget {
  const _SurfaceCard({
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(14, 14, 14, 14),
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.6)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}
