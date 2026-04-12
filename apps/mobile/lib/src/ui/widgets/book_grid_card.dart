import 'dart:math' as math;

import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/book_ui_labels.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';

/// 그리드 열 수에 따른 카드 가로세로 비율 (표지 2:3 + 하단 메타).
///
/// History:
/// - 2026-04-12: 읽는 중 상태색 — `DESIGN.md` tertiary(Archivist's Ribbon)
/// - 2026-04-05: 4열(넓은 폰·폴드) 대응 비율
/// - 2026-03-25: `library_screen`에서 분리해 공동서재 그리드와 공유
double bookGridCardAspectRatio(int columns) {
  return switch (columns) {
    4 => 0.53,
    3 => 0.50,
    _ => 0.46,
  };
}

/// 가용 가로 폭(좌우 패딩 제외)에 따라 그리드 열 수를 정한다.
///
/// `minTileWidth`·`crossAxisSpacing`을 만족하도록 [minColumns]~[maxColumns]로 클램프한다.
///
/// History:
/// - 2026-04-05: 폰·태블릿 폭 가변 그리드(내 서재·공동서재 공통)
int bookfolioGridCrossAxisCount(
  double crossAxisExtent, {
  double crossAxisSpacing = 10,
  double minTileWidth = 124,
  int minColumns = 2,
  int maxColumns = 4,
}) {
  if (crossAxisExtent.isNaN || !crossAxisExtent.isFinite || crossAxisExtent <= 0) {
    return minColumns;
  }
  final unit = minTileWidth + crossAxisSpacing;
  final raw = ((crossAxisExtent + crossAxisSpacing) / unit).floor();
  return math.min(maxColumns, math.max(minColumns, raw));
}

/// 내 서재·공동서재 공통 표지 카드.
///
/// History:
/// - 2026-04-03: 그리드 셀 높이 한계에서 표지 높이 상한 — 하단 메타 `Column` bottom overflow 방지
/// - 2026-04-02: `Align`+`Column`(min)으로 본문을 상단 정렬·메타 패딩·줄간격 소폭 축소
/// - 2026-04-02: 표지 아래 메타 영역 패딩 축소(그리드 셀 하단 빈 여백 완화와 함께 조정)
/// - 2026-04-02: `coverScale` — 표지 가로 비율 축소(그리드에서 표지만 작게)
/// - 2026-03-29: `ownerBadgeLabels`·테마 기반 카드·본문 색
/// - 2026-03-25: 신규 (`UserBook` 전용 카드에서 일반화)
/// - 2026-04-05: `DESIGN.md` — `surfaceContainerLowest`·`radiusSm`·무(無) 엘리베이션(톤 레이어링)
class BookGridCard extends StatelessWidget {
  const BookGridCard({
    super.key,
    required this.title,
    required this.authorsLine,
    this.coverUrl,
    required this.onTap,
    this.coverBadge,
    this.ownerBadgeLabels,
    required this.gradientSeedA,
    required this.gradientSeedB,
    this.coverScale = 1.0,
  });

  final String title;
  final String authorsLine;
  final String? coverUrl;
  final VoidCallback onTap;
  final Widget? coverBadge;
  /// 공동서재 등 — 표지 아래 웹 `Badge`와 유사한 소유자 이름 칩.
  final List<String>? ownerBadgeLabels;
  final String gradientSeedA;
  final String gradientSeedB;

  /// 1.0보다 작으면 표지 영역 가로를 줄여 카드에서 표지 비중을 낮춥니다.
  final double coverScale;

  static const double _coverAspect = 2 / 3;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final cover = resolveCoverImageUrl(coverUrl);
    final hasCover = cover != null;
    final cardBg = scheme.surfaceContainerLowest;
    final placeholder = scheme.surfaceContainerHighest;

    return Card(
      clipBehavior: Clip.antiAlias,
      elevation: 0,
      shadowColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
      ),
      color: cardBg,
      child: InkWell(
        onTap: onTap,
        child: LayoutBuilder(
          builder: (context, cellConstraints) {
            final maxW = cellConstraints.maxWidth;
            final maxH = cellConstraints.maxHeight;
            final targetCoverW = maxW * coverScale.clamp(0.5, 1.0);
            final naturalCoverH = targetCoverW / _coverAspect;
            final hasOwnerRow = ownerBadgeLabels != null && ownerBadgeLabels!.isNotEmpty;

            final coverStack = Stack(
              fit: StackFit.expand,
              children: [
                Positioned.fill(
                  child: hasCover
                      ? Image.network(
                          cover,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                          headers: kCoverImageRequestHeaders,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return ColoredBox(
                              color: placeholder,
                              child: Center(
                                child: SizedBox(
                                  width: 28,
                                  height: 28,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                              ),
                            );
                          },
                          errorBuilder: (_, __, ___) => GradientTitlePanel(
                            title: title,
                            seedA: gradientSeedA,
                            seedB: gradientSeedB,
                          ),
                        )
                      : GradientTitlePanel(
                          title: title,
                          seedA: gradientSeedA,
                          seedB: gradientSeedB,
                        ),
                ),
                if (coverBadge != null)
                  Positioned(
                    top: 6,
                    left: 6,
                    child: coverBadge!,
                  ),
              ],
            );

            // 제목 2줄·저자·vertical 패딩·웹/시스템 폰트 배율까지 감안한 여유
            final ownerReserve = hasOwnerRow ? 40.0 : 0.0;
            const metaReserve = 76.0;
            final coverH = maxH.isFinite
                ? math.min(
                    naturalCoverH,
                    math.max(maxH - ownerReserve - metaReserve, 20.0),
                  )
                : naturalCoverH;

            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Align(
                  alignment: Alignment.topCenter,
                  child: SizedBox(
                    width: targetCoverW,
                    height: coverH,
                    child: coverStack,
                  ),
                ),
                if (hasOwnerRow)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 4, 8, 0),
                    child: Wrap(
                      spacing: 4,
                      runSpacing: 4,
                      alignment: WrapAlignment.center,
                      children: ownerBadgeLabels!
                          .map(
                            (name) => Chip(
                              visualDensity: VisualDensity.compact,
                              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              padding: EdgeInsets.zero,
                              labelPadding: const EdgeInsets.symmetric(horizontal: 6),
                              label: Text(
                                name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: theme.textTheme.labelSmall?.copyWith(
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              side: BorderSide(color: scheme.outlineVariant),
                              backgroundColor: scheme.secondaryContainer.withValues(alpha: 0.65),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 6, 8, 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (hasCover)
                        Text(
                          title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            height: 1.2,
                            color: scheme.onSurface,
                          ),
                        ),
                      if (hasCover && authorsLine.isNotEmpty) const SizedBox(height: 3),
                      if (authorsLine.isNotEmpty)
                        Text(
                          authorsLine,
                          maxLines: hasOwnerRow ? 2 : 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// 표지 위 읽기 상태 뱃지.
///
/// History:
/// - 2026-03-25: `library_screen`에서 이동
class ReadingStatusCoverBadge extends StatelessWidget {
  const ReadingStatusCoverBadge({super.key, required this.status});

  final ReadingStatus status;

  @override
  Widget build(BuildContext context) {
    final accent = readingStatusColor(status);
    return Tooltip(
      message: readingStatusLabelKo(status),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: const Color(0xD9000000),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.38), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.35),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(5),
          child: Icon(
            readingStatusIcon(status),
            size: 19,
            color: Color.lerp(Colors.white, accent, 0.2)!,
            shadows: const [
              Shadow(offset: Offset(0, 0.5), blurRadius: 2.5, color: Colors.black54),
            ],
          ),
        ),
      ),
    );
  }
}

IconData readingStatusIcon(ReadingStatus s) {
  return switch (s) {
    ReadingStatus.unread => Icons.bookmark_border_rounded,
    ReadingStatus.reading => Icons.auto_stories_rounded,
    ReadingStatus.completed => Icons.check_circle_rounded,
    ReadingStatus.paused => Icons.pause_circle_rounded,
    ReadingStatus.dropped => Icons.bookmark_remove_rounded,
  };
}

Color readingStatusColor(ReadingStatus s) {
  return switch (s) {
    ReadingStatus.reading => BookfolioDesignTokens.tertiary,
    ReadingStatus.completed => const Color(0xFF1565C0),
    ReadingStatus.unread => const Color(0xFF6D4C41),
    ReadingStatus.paused => const Color(0xFFF9A825),
    ReadingStatus.dropped => const Color(0xFF78909C),
  };
}

/// 공동서재 등 소유자가 여러 명일 때 표지 좌상단 인원 뱃지.
///
/// History:
/// - 2026-03-25: 신규
class OwnerCountCoverBadge extends StatelessWidget {
  const OwnerCountCoverBadge({super.key, required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: '소유자 $count명',
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: const Color(0xD9000000),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.38), width: 1),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.people_alt_outlined, size: 16, color: Color(0xF2FFFFFF)),
              const SizedBox(width: 4),
              Text(
                '$count',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Color(0xF2FFFFFF),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// 표지가 없거나 로드 실패 시 상단 영역에 제목 그라데이션.
///
/// History:
/// - 2026-03-25: `UserBook.id` 대신 시드 문자열을 받도록 일반화
class GradientTitlePanel extends StatelessWidget {
  const GradientTitlePanel({
    super.key,
    required this.title,
    required this.seedA,
    required this.seedB,
  });

  final String title;
  final String seedA;
  final String seedB;

  @override
  Widget build(BuildContext context) {
    final c1 = Color(0xFF000000 | (seedA.hashCode * 4999 & 0xFFFFFF));
    final c2 = Color(0xFF000000 | (seedB.hashCode * 7919 & 0xFFFFFF));
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color.lerp(c1, Colors.white, 0.4)!,
            Color.lerp(c2, Colors.black, 0.2)!,
          ],
        ),
      ),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Text(
            title,
            textAlign: TextAlign.center,
            maxLines: 5,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              height: 1.3,
              color: Color(0xF2FFFFFF),
              shadows: [
                Shadow(offset: Offset(0, 1), blurRadius: 3, color: Colors.black38),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
