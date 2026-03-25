import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/ui/book_ui_labels.dart';
import 'package:bookfolio_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';

/// 그리드 열 수에 따른 카드 가로세로 비율 (표지 2:3 + 하단 메타).
///
/// History:
/// - 2026-03-25: `library_screen`에서 분리해 공동서재 그리드와 공유
double bookGridCardAspectRatio(int columns) {
  return switch (columns) {
    3 => 0.50,
    _ => 0.46,
  };
}

/// 내 서재·공동서재 공통 표지 카드.
///
/// History:
/// - 2026-03-25: 신규 (`UserBook` 전용 카드에서 일반화)
class BookGridCard extends StatelessWidget {
  const BookGridCard({
    super.key,
    required this.title,
    required this.authorsLine,
    this.coverUrl,
    required this.onTap,
    this.coverBadge,
    required this.gradientSeedA,
    required this.gradientSeedB,
  });

  final String title;
  final String authorsLine;
  final String? coverUrl;
  final VoidCallback onTap;
  final Widget? coverBadge;
  final String gradientSeedA;
  final String gradientSeedB;

  static const double _coverAspect = 2 / 3;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cover = resolveCoverImageUrl(coverUrl);
    final hasCover = cover != null;

    return Card(
      clipBehavior: Clip.antiAlias,
      elevation: 1.5,
      shadowColor: Colors.black26,
      surfaceTintColor: Colors.transparent,
      color: const Color(0xFFFFFBF7),
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: _coverAspect,
              child: Stack(
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
                                color: const Color(0xFFE8E0D8),
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
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (hasCover)
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        height: 1.25,
                        color: const Color(0xFF3E342C),
                      ),
                    ),
                  if (hasCover && authorsLine.isNotEmpty) const SizedBox(height: 4),
                  if (authorsLine.isNotEmpty)
                    Text(
                      authorsLine,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF6B5B4D),
                      ),
                    ),
                ],
              ),
            ),
          ],
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
    ReadingStatus.reading => const Color(0xFF2E7D32),
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
