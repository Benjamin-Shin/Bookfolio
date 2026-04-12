import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';

/// 서가담 집계 API 본문용 공통 위젯.
///
/// @history
/// - 2026-04-07: 섹션 타이틀 `title-md`·카드 톤 레이어링(DESIGN no elevation)
/// - 2026-04-05: `BookfolioAggregateScreen`·`LibraryAnalysisScreen`에서 공유하도록 분리
Widget bookfolioAggregateSectionTitle(ThemeData theme, String title) {
  return Padding(
    padding: const EdgeInsets.only(top: 12, bottom: 8),
    child: Text(
      title,
      style: BookfolioDesignTokens.titleMd(BookfolioDesignTokens.onSurface, fontWeight: FontWeight.w700),
    ),
  );
}

class BookfolioMemberLeaderboardCard extends StatelessWidget {
  const BookfolioMemberLeaderboardCard({super.key, required this.data, required this.unit});

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
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: scheme.surfaceContainerLowest,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
          side: BookfolioDesignTokens.ghostBorderSide(opacity: 0.1),
        ),
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
      ),
    );
  }
}

class BookfolioPopularBooksSection extends StatelessWidget {
  const BookfolioPopularBooksSection({super.key, required this.raw});

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
        final scheme = Theme.of(context).colorScheme;
        final coverUrl = cover != null && cover.isNotEmpty ? resolveCoverImageUrl(cover) : null;
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Material(
            color: scheme.surfaceContainerLowest,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
              side: BookfolioDesignTokens.ghostBorderSide(opacity: 0.1),
            ),
            child: ListTile(
              leading: SizedBox(
                width: 48,
                height: 72,
                child: coverUrl != null
                    ? Image.network(
                        coverUrl,
                        fit: BoxFit.cover,
                        headers: kCoverImageRequestHeaders,
                        errorBuilder: (_, __, ___) => ColoredBox(
                          color: scheme.surfaceContainerHigh,
                          child: Icon(Icons.menu_book_outlined, size: 22, color: scheme.onSurfaceVariant),
                        ),
                      )
                    : ColoredBox(
                        color: scheme.surfaceContainerHigh,
                        child: Icon(Icons.menu_book_outlined, size: 22, color: scheme.onSurfaceVariant),
                      ),
              ),
              title: Text(title, maxLines: 2, overflow: TextOverflow.ellipsis),
              subtitle: Text('$owners명 소장 등록'),
            ),
          ),
        );
      }).toList(),
    );
  }
}
