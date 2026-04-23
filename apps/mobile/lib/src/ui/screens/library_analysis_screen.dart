import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/widgets/bookfolio_aggregate_widgets.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 내 서가 분석(종이책·집계 API).
///
/// History:
/// - 2026-04-07: `Divider` 제거·「서가담 집계」카피 — Stitch1/DESIGN no-line
/// - 2026-04-05: 하단에 커뮤니티 집계(구 홈 탭) 포함
/// - 2026-04-05: `embeddedInShell` — 메인 쉘 「통계」탭에서 앱바 없이 본문만
/// - 2026-04-02: 신규
class LibraryAnalysisScreen extends StatefulWidget {
  const LibraryAnalysisScreen({super.key, this.embeddedInShell = false});

  final bool embeddedInShell;

  @override
  State<LibraryAnalysisScreen> createState() => _LibraryAnalysisScreenState();
}

class _LibraryAnalysisScreenState extends State<LibraryAnalysisScreen> {
  PersonalLibrarySummary? _summary;
  Map<String, dynamic>? _aggregatePayload;
  String? _aggregateError;
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
    Map<String, dynamic>? agg;
    String? aggErr;
    try {
      agg = await api.fetchBookfolioAggregate(top: 10);
    } catch (e) {
      aggErr = e.toString();
    }

    try {
      final s = await api.fetchPersonalLibrarySummary();
      if (!mounted) return;
      setState(() {
        _summary = s;
        _aggregatePayload = agg;
        _aggregateError = aggErr;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _aggregatePayload = agg;
        _aggregateError = aggErr;
        _loading = false;
      });
    }
  }

  Map<String, dynamic>? _mapAggSection(dynamic v) =>
      v is Map<String, dynamic> ? v : null;

  String _won(int n) {
    final s = n.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final s = _summary;

    final list = ListView(
      physics:
          widget.embeddedInShell ? const AlwaysScrollableScrollPhysics() : null,
      padding: widget.embeddedInShell
          ? bookfolioShellTabScrollPadding(context)
          : bookfolioMobileScrollPadding(context),
      children: [
        Text(
          '종이책 기준입니다. 인생책은 별점 5점 완독으로 임시 집계합니다.',
          style: tt.bodySmall
              ?.copyWith(color: scheme.onSurfaceVariant, height: 1.35),
        ),
        const SizedBox(height: 16),
        if (_loading)
          const Center(
              child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator()))
        else ...[
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_error!, style: TextStyle(color: scheme.error)),
            ),
          if (s != null) ...[
            _AnalysisBlock(
              value: '${s.physicalPaperCount}권',
              caption: '실제 등록 권수(물리 권)',
              child: Text('내 서가의 책 수',
                  style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
            ),
            SizedBox(height: BookfolioDesignTokens.sectionGapSm),
            _AnalysisBlock(
              value: '${s.ownedWorkCount}권',
              caption: '시리즈는 제목 정규화로 묶은 작품 수(근사)',
              child: Text('내가 소장 중인 책 수',
                  style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
            ),
            SizedBox(height: BookfolioDesignTokens.sectionGapSm),
            Text('내 서가 현황',
                style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _StatusChip(
                    icon: Icons.check_circle_outline,
                    label: '완독',
                    value: s.completedCount,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _StatusChip(
                    icon: Icons.menu_book_outlined,
                    label: '읽기 전',
                    value: s.unreadCount,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _StatusChip(
                    icon: Icons.star_border_rounded,
                    label: '인생책',
                    value: s.lifeBookCount,
                  ),
                ),
              ],
            ),
            SizedBox(height: BookfolioDesignTokens.sectionGapSm),
            _AnalysisBlock(
              value: '${_won(s.totalListPriceKrw)}원',
              caption: '캐논 정가 합계(가격이 입력된 소장 권)',
              child: Text('내 서가의 총 가격',
                  style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
            ),
            SizedBox(height: BookfolioDesignTokens.sectionGapSm),
            _AnalysisBlock(
              value: '${s.memoCount}개',
              child: Text('내가 기록한 메모',
                  style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
            ),
            SizedBox(height: BookfolioDesignTokens.sectionGapSm),
            _AnalysisBlock(
              value: '${s.oneLinerCount}개',
              child: Text('내가 기록한 한줄평',
                  style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
            ),
            SizedBox(height: BookfolioDesignTokens.sectionGapSm),
            Text('저자별 소장 TOP 3',
                style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            if (s.topAuthorsByOwnedCount.isEmpty)
              Text(
                '집계할 저자 정보가 없습니다.',
                style: tt.bodySmall?.copyWith(color: scheme.onSurfaceVariant),
              )
            else
              ...s.topAuthorsByOwnedCount.asMap().entries.map((e) {
                final rank = e.key + 1;
                final a = e.value;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    tileColor: scheme.surfaceContainerHigh,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    leading: CircleAvatar(
                      backgroundColor: scheme.primaryContainer,
                      child: Text('$rank',
                          style: TextStyle(
                              color: scheme.onPrimaryContainer,
                              fontWeight: FontWeight.w800)),
                    ),
                    title: Text(a.name,
                        maxLines: 2, overflow: TextOverflow.ellipsis),
                    trailing: Text('${a.count}권',
                        style: tt.titleSmall
                            ?.copyWith(fontWeight: FontWeight.w700)),
                  ),
                );
              }),
          ],
          if (!_loading) ...[
            if (s != null) SizedBox(height: BookfolioDesignTokens.sectionGapMd),
            Text(
              '서가담 집계',
              style: BookfolioDesignTokens.headlineMd(
                      BookfolioDesignTokens.primary,
                      fontStyle: FontStyle.normal)
                  .copyWith(fontSize: 22, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              '회원 간 순위·인기 소장 도서입니다.',
              style: tt.bodySmall
                  ?.copyWith(color: scheme.onSurfaceVariant, height: 1.35),
            ),
            const SizedBox(height: 12),
            if (_aggregateError != null)
              Text(_aggregateError!,
                  style: TextStyle(color: scheme.error, fontSize: 13))
            else if (_aggregatePayload != null) ...[
              bookfolioAggregateSectionTitle(Theme.of(context), '소장 건수 순위'),
              BookfolioMemberLeaderboardCard(
                  data: _mapAggSection(_aggregatePayload!['ownedBooks']),
                  unit: '권'),
              bookfolioAggregateSectionTitle(Theme.of(context), '완독 순위'),
              BookfolioMemberLeaderboardCard(
                  data: _mapAggSection(_aggregatePayload!['completedBooks']),
                  unit: '권'),
              bookfolioAggregateSectionTitle(Theme.of(context), '소장 책 순위'),
              BookfolioPopularBooksSection(
                  raw: _aggregatePayload!['popularOwnedBooks']),
              bookfolioAggregateSectionTitle(Theme.of(context), '포인트 순위'),
              BookfolioMemberLeaderboardCard(
                  data: _mapAggSection(_aggregatePayload!['points']),
                  unit: 'P'),
            ] else
              Text(
                '집계 데이터를 불러오지 못했습니다.',
                style: tt.bodySmall?.copyWith(color: scheme.onSurfaceVariant),
              ),
          ],
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
      appBar: AppBar(
        title: const Text('내 서가 분석'),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: list,
      ),
    );
  }
}

class _AnalysisBlock extends StatelessWidget {
  const _AnalysisBlock(
      {required this.value, this.caption, required this.child});

  final String value;
  final String? caption;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        child,
        const SizedBox(height: 8),
        Text(
          value,
          style: tt.headlineSmall
              ?.copyWith(fontWeight: FontWeight.w800, color: scheme.primary),
        ),
        if (caption != null) ...[
          const SizedBox(height: 6),
          Text(
            caption!,
            style: tt.bodySmall
                ?.copyWith(color: scheme.onSurfaceVariant, height: 1.3),
          ),
        ],
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip(
      {required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 26, color: scheme.primary),
          const SizedBox(height: 6),
          Text(
            '$value',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          Text(
            label,
            style: Theme.of(context)
                .textTheme
                .labelSmall
                ?.copyWith(color: scheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
