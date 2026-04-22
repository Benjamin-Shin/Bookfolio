import 'dart:math' as math;

import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/book_detail_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/book_form_screen.dart';
import 'package:seogadam_mobile/src/ui/widgets/reading_events_calendar_card.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

/// 메인 쉘 「홈」— 에디토리얼 벤토 대시(HTML 목업 정렬).
///
/// @history
/// - 2026-04-22: 추천 API 연동 — `GET /api/me/recommendations` 기반 추천 카드 + 관심 저장/추가 상호작용 로깅
/// - 2026-04-12: 홈 데이터 — `GET /api/me/mobile-home` 단일 요청으로 일괄 로드
/// - 2026-04-12: 이벤트 캘린더 — `LibraryScreen` 요약 탭에서 이전(`ReadingEventsCalendarCard`)
/// - 2026-04-12: 차트 보조색 — `DESIGN.md` secondary 톤
/// - 2026-04-07: 환영 헤더 타이포 Newsreader(Stitch1·DESIGN headline 계열)
/// - 2026-04-05: 환영 인사 — 프로필 `displayName`/이메일 기준(로딩 중·무표시, 폴백 `회원`)
/// - 2026-04-06: 독서 진행 쪽·프로필 연간 목표 반영
/// - 2026-04-05: 초기 구현 — 읽기 전 목록을 「추천」 그리드로, 공동서재 CTA·빠른 이동
class BookfolioHomeScreen extends StatefulWidget {
  const BookfolioHomeScreen({
    super.key,
    required this.refreshSignal,
    required this.onOpenSharedLibraries,
    required this.onOpenMyLibrary,
    required this.onOpenStats,
  });

  /// [MainShellScreen]에서 도서 등록 후 증가시키면 홈 데이터를 다시 불러옵니다.
  final int refreshSignal;
  final VoidCallback onOpenSharedLibraries;
  final VoidCallback onOpenMyLibrary;
  final VoidCallback onOpenStats;

  @override
  State<BookfolioHomeScreen> createState() => _BookfolioHomeScreenState();
}

class _BookfolioHomeScreenState extends State<BookfolioHomeScreen> {
  static const Color _chartSecondary = BookfolioDesignTokens.secondary;

  final GlobalKey<ReadingEventsCalendarCardState> _eventsCalendarKey =
      GlobalKey<ReadingEventsCalendarCardState>();

  MeAppProfile? _profile;
  PersonalLibrarySummary? _summary;
  PointsBalanceResult? _points;
  UserBook? _readingBook;
  List<RecommendationBook> _recommendations = const [];
  String? _recommendationError;
  final String _recommendationRequestId =
      'mobile-home-${DateTime.now().microsecondsSinceEpoch}';
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void didUpdateWidget(BookfolioHomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.refreshSignal != widget.refreshSignal) {
      _load();
    }
  }

  Future<void> _load() async {
    final api = context.read<LibraryController>().api;
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final bundle = await api.fetchMobileHome();
      RecommendationsResult? recommendationResult;
      String? recommendationError;
      try {
        recommendationResult = await api.fetchRecommendations(
          limit: 6,
          trackImpression: true,
          requestId: _recommendationRequestId,
          bucket: 'mobile_home',
        );
      } catch (e) {
        recommendationError = e.toString();
      }
      if (!mounted) return;
      setState(() {
        _profile = bundle.profile;
        _summary = bundle.personalLibrarySummary;
        _points = bundle.points;
        _readingBook = bundle.readingBook;
        _recommendations = recommendationResult?.items ?? const [];
        _recommendationError = recommendationError;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _eventsCalendarKey.currentState?.reload();
    });
  }

  /// 프로필에서 표시할 회원 이름. 없으면 null(인사 문구에서 이름 줄 생략).
  String? _memberDisplayName() {
    final p = _profile;
    if (p == null) return null;
    final n = (p.displayName ?? '').trim();
    if (n.isNotEmpty) return n;
    final em = p.email.trim();
    if (em.isNotEmpty) {
      if (em.contains('@')) return em.split('@').first;
      return em;
    }
    return '회원';
  }

  void _openBook(UserBook b) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => BookDetailScreen(book: b)),
    );
  }

  Future<void> _openAddBook() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const BookFormScreen()),
    );
    if (!mounted) return;
    await context.read<LibraryController>().loadBooks();
    await _load();
  }

  Future<void> _openAddBookWithRecommendation(RecommendationBook rec) async {
    final prefill = BookLookupResult(
      isbn: '',
      title: rec.title,
      authors: rec.authors,
      publisher: null,
      publishedDate: null,
      coverUrl: rec.coverUrl,
      description: null,
      priceKrw: null,
      source: 'recommendation',
      genreSlugs: rec.genreSlugs,
      literatureRegion: null,
      originalLanguage: null,
    );
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => BookFormScreen(prefill: prefill)),
    );
    if (!mounted) return;
    await context.read<LibraryController>().loadBooks();
    await _load();
  }

  Future<void> _recordRecommendationInteraction(
    RecommendationBook rec,
    String interactionType,
  ) async {
    try {
      final api = context.read<LibraryController>().api;
      await api.recordRecommendationInteraction(
        bookId: rec.bookId,
        interactionType: interactionType,
        surface: 'mobile_home_recommendation',
        requestId: _recommendationRequestId,
        metadata: {'title': rec.title},
      );
    } catch (_) {
      // no-op
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final dateLine = DateFormat.yMMMMd('ko').format(DateTime.now());

    return SizedBox.expand(
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: bookfolioShellTabScrollPadding(context),
          children: [
            _buildWelcomeHeader(context, dateLine),
            const SizedBox(height: 20),
            _buildCtaRow(context),
            const SizedBox(height: 14),
            _buildQuickLinks(context),
            const SizedBox(height: 24),
            ReadingEventsCalendarCard(key: _eventsCalendarKey),
            const SizedBox(height: 28),
            if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: Center(child: CircularProgressIndicator()),
              )
            else ...[
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(_error!, style: TextStyle(color: scheme.error, fontSize: 13)),
                ),
              LayoutBuilder(
                builder: (context, c) {
                  final wide = c.maxWidth >= 600;
                  final reading = _buildReadingFeature(context);
                  final summary = _buildLibrarySummaryCard(context);
                  if (wide) {
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(flex: 8, child: reading),
                        const SizedBox(width: 20),
                        Expanded(flex: 4, child: summary),
                      ],
                    );
                  }
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      reading,
                      const SizedBox(height: 20),
                      summary,
                    ],
                  );
                },
              ),
              const SizedBox(height: 32),
              _buildRecommendSection(context),
              const SizedBox(height: 32),
              _buildMonthlyInsight(context),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeHeader(BuildContext context, String dateLine) {
    final name = _memberDisplayName();
    final welcomeLine = (_loading && name == null)
        ? '다시 오신 것을 환영합니다.'
        : '다시 오신 것을 환영합니다,\n${name ?? '회원'}님.';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          welcomeLine,
          style: GoogleFonts.newsreader(
            fontSize: 32,
            height: 1.12,
            fontWeight: FontWeight.w600,
            fontStyle: FontStyle.italic,
            color: BookfolioDesignTokens.primary,
            letterSpacing: -0.35,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          '개인 서재 · $dateLine',
          style: GoogleFonts.manrope(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.1,
            color: BookfolioDesignTokens.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  Widget _buildCtaRow(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 10,
      children: [
        FilledButton.icon(
          onPressed: _openAddBook,
          style: FilledButton.styleFrom(
            backgroundColor: BookfolioDesignTokens.primary,
            foregroundColor: BookfolioDesignTokens.onPrimary,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusMd)),
          ),
          icon: const Icon(Icons.add, size: 18),
          label: Text(
            '도서 추가',
            style: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 14),
          ),
        ),
        OutlinedButton.icon(
          onPressed: widget.onOpenSharedLibraries,
          style: OutlinedButton.styleFrom(
            foregroundColor: BookfolioDesignTokens.primary,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            side: BookfolioDesignTokens.ghostBorderSide(opacity: 0.35),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusMd)),
          ),
          icon: const Icon(Icons.people_outline, size: 18),
          label: Text(
            '공동 서재',
            style: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 14),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickLinks(BuildContext context) {
    TextStyle linkStyle(Color c) => GoogleFonts.manrope(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 1.0,
          color: c,
        );

    return DecoratedBox(
      decoration: BoxDecoration(
        color: BookfolioDesignTokens.surfaceContainerLow,
        borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
        border: Border.all(color: BookfolioDesignTokens.ghostOutline(0.12)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '빠른 이동',
              style: GoogleFonts.manrope(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: BookfolioDesignTokens.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: [
                _TextLink(label: '내 서재', onTap: widget.onOpenMyLibrary, style: linkStyle(BookfolioDesignTokens.primary)),
                _TextLink(
                  label: '공동 서재',
                  onTap: widget.onOpenSharedLibraries,
                  style: linkStyle(BookfolioDesignTokens.primary),
                ),
                _TextLink(label: '통계', onTap: widget.onOpenStats, style: linkStyle(BookfolioDesignTokens.onSurfaceVariant)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReadingFeature(BuildContext context) {
    final b = _readingBook;
    if (b == null) {
      return _surfaceCard(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _chip(context, '지금 읽는 중'),
              const SizedBox(height: 16),
              Text(
                '읽는 중인 책이 없습니다',
                style: BookfolioDesignTokens.headlineMd(BookfolioDesignTokens.primary, fontStyle: FontStyle.normal),
              ),
              const SizedBox(height: 8),
              Text(
                '서재에서 상태를 「읽는 중」으로 바꾸면 이곳에 표시됩니다.',
                style: BookfolioDesignTokens.bodyLg(
                  BookfolioDesignTokens.onSurface.withValues(alpha: 0.75),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: widget.onOpenMyLibrary,
                child: Text(
                  '내 서재 열기',
                  style: GoogleFonts.manrope(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                    color: BookfolioDesignTokens.primary,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final cover = resolveCoverImageUrl(b.coverUrl);
    final desc = (b.description ?? '').trim();
    final excerpt = desc.length > 160 ? '${desc.substring(0, 160)}…' : desc;

    return _surfaceCard(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
                  child: SizedBox(
                    width: 112,
                    child: AspectRatio(
                      aspectRatio: 2 / 3,
                      child: cover != null
                          ? Image.network(
                              cover,
                              fit: BoxFit.cover,
                              headers: kCoverImageRequestHeaders,
                              errorBuilder: (_, __, ___) => _coverPlaceholder(context),
                            )
                          : _coverPlaceholder(context),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _chip(context, '지금 읽는 중'),
                      const SizedBox(height: 10),
                      Text(
                        b.title,
                        style: BookfolioDesignTokens.headlineMd(BookfolioDesignTokens.primary, fontStyle: FontStyle.normal),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (b.authors.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          '${b.authors.join(', ')} 저',
                          style: GoogleFonts.notoSerifKr(
                            fontSize: 17,
                            fontStyle: FontStyle.italic,
                            color: BookfolioDesignTokens.onSurfaceVariant,
                            height: 1.3,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            if (excerpt.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                '“$excerpt”',
                style: BookfolioDesignTokens.bodyLg(
                  BookfolioDesignTokens.onSurface.withValues(alpha: 0.8),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Builder(
              builder: (context) {
                final total = b.effectiveTotalPages;
                final cur = b.currentPage ?? 0;
                double? ratio;
                if (total != null && total >= 1) {
                  ratio = (cur / total).clamp(0.0, 1.0);
                }
                final label = total != null && total >= 1
                    ? '독서 진행률: ${(ratio! * 100).round()}% · $total쪽 중 $cur쪽'
                    : '도서 상세에서 현재 쪽·총 쪽을 입력하면 진행률이 표시됩니다.';
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      label,
                      style: BookfolioDesignTokens.labelMd(
                        BookfolioDesignTokens.onSurfaceVariant,
                        opacity: 0.9,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: ratio,
                        minHeight: 4,
                        backgroundColor: BookfolioDesignTokens.surfaceContainerLow,
                        color: BookfolioDesignTokens.primary,
                      ),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                _underlineButton(
                  label: '계속 읽기',
                  emphasized: true,
                  onTap: () => _openBook(b),
                ),
                const SizedBox(width: 20),
                _underlineButton(
                  label: '메모 추가',
                  emphasized: false,
                  onTap: () => _openBook(b),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLibrarySummaryCard(BuildContext context) {
    final s = _summary;
    final pts = _points?.balance ?? 0;
    return _surfaceCard(
      color: BookfolioDesignTokens.surfaceContainerLow,
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              '서재 현황',
              style: BookfolioDesignTokens.headlineMd(BookfolioDesignTokens.primary, fontStyle: FontStyle.normal).copyWith(fontSize: 24),
            ),
            const SizedBox(height: 20),
            _statRow('다 읽은 권수', s != null ? '${s.completedCount}' : '—'),
            const SizedBox(height: 18),
            _statRow(
              '올해 목표',
              s != null
                  ? (_profile?.annualReadingGoal != null && _profile!.annualReadingGoal! >= 1
                      ? '${s.readCompleteThisYearCount}/${_profile!.annualReadingGoal}'
                      : '${s.readCompleteThisYearCount}권')
                  : '—',
            ),
            const SizedBox(height: 6),
            Text(
              _profile?.annualReadingGoal != null && _profile!.annualReadingGoal! >= 1
                  ? '완독 ${s?.readCompleteThisYearCount ?? 0}권 · 목표 ${_profile!.annualReadingGoal}권'
                  : '목표는 프로필 편집에서 설정할 수 있습니다.',
              style: GoogleFonts.manrope(fontSize: 11, color: BookfolioDesignTokens.onSurfaceVariant, height: 1.35),
            ),
            const SizedBox(height: 18),
            _statRow('큐레이터 포인트', _formatInt(pts)),
            const SizedBox(height: 22),
            Container(
              padding: const EdgeInsets.only(top: 18),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: BookfolioDesignTokens.ghostOutline(0.2))),
              ),
              child: Text(
                s != null && s.totalPagesRead > 0
                    ? '“기록된 읽기로 약 ${s.totalPagesRead}페이지를 넘겼습니다. 서재가 차곡차곡 쌓이고 있어요.”'
                    : '“오늘 한 권만 더해도 서재는 조용히 자라납니다.”',
                style: GoogleFonts.manrope(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  height: 1.45,
                  color: BookfolioDesignTokens.onSurfaceVariant,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecommendSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Text(
                '당신을 위한 추천',
                style: BookfolioDesignTokens.headlineMd(BookfolioDesignTokens.primary, fontStyle: FontStyle.normal).copyWith(fontSize: 26),
              ),
            ),
            TextButton(
              onPressed: widget.onOpenMyLibrary,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.only(left: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                '전체 카탈로그 보기',
                style: GoogleFonts.manrope(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: BookfolioDesignTokens.primary,
                  decoration: TextDecoration.underline,
                  decorationColor: BookfolioDesignTokens.tertiary.withValues(alpha: 0.4),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          '최근 평점·독서 상태·장르 선호를 기반으로 추천합니다.',
          style: GoogleFonts.manrope(fontSize: 12, color: BookfolioDesignTokens.onSurfaceVariant, height: 1.35),
        ),
        const SizedBox(height: 18),
        if (_recommendationError != null)
          Text(
            _recommendationError!,
            style: GoogleFonts.manrope(
              fontSize: 12,
              color: Theme.of(context).colorScheme.error,
            ),
          )
        else if (_recommendations.isEmpty)
          Text(
            '추천할 책이 아직 없습니다. 평점/완독 데이터가 쌓이면 더 정확해집니다.',
            style: BookfolioDesignTokens.bodyLg(BookfolioDesignTokens.onSurfaceVariant),
          )
        else
          LayoutBuilder(
            builder: (context, c) {
              const gap = 16.0;
              final w = c.maxWidth;
              final cols = w >= 520 ? 3 : 1;
              final tileW = (w - gap * (cols - 1)) / cols;
              return Wrap(
                spacing: gap,
                runSpacing: gap,
                children: _recommendations.map((book) {
                  return SizedBox(
                    width: tileW,
                    child: _RecommendationCard(
                      rec: book,
                      onTapSave: () async {
                        await _recordRecommendationInteraction(book, 'save');
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('관심 저장했습니다.')),
                        );
                      },
                      onTapAdd: () async {
                        await _recordRecommendationInteraction(book, 'click');
                        await _openAddBookWithRecommendation(book);
                      },
                    ),
                  );
                }).toList(),
              );
            },
          ),
      ],
    );
  }

  Widget _buildMonthlyInsight(BuildContext context) {
    final s = _summary;
    final month = DateTime.now().month;
    final authors = s?.topAuthorsByOwnedCount ?? const [];
    final total = authors.fold<int>(0, (a, e) => a + e.count);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: BookfolioDesignTokens.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
        border: Border.all(color: BookfolioDesignTokens.ghostOutline(0.1)),
        boxShadow: BookfolioDesignTokens.ambientShadowPrimary(),
      ),
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: LayoutBuilder(
          builder: (context, c) {
            final wide = c.maxWidth >= 560;
            final left = Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$month월의 통계',
                  style: BookfolioDesignTokens.headlineMd(BookfolioDesignTokens.primary, fontStyle: FontStyle.normal).copyWith(fontSize: 26),
                ),
                const SizedBox(height: 10),
                Text(
                  s == null
                      ? '통계를 불러오지 못했습니다.'
                      : '이번 달 완독 ${s.readCompleteThisMonthCount}권입니다. 아래는 소장 권수 기준으로 많이 등록된 저자 비율입니다.',
                  style: BookfolioDesignTokens.bodyLg(
                    BookfolioDesignTokens.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 18),
                if (authors.isEmpty || total <= 0)
                  Text(
                    '저자별 비율을 계산할 데이터가 부족합니다.',
                    style: GoogleFonts.manrope(fontSize: 12, color: BookfolioDesignTokens.onSurfaceVariant),
                  )
                else
                  ...authors.take(3).toList().asMap().entries.map((e) {
                    final i = e.key;
                    final a = e.value;
                    final pct = (100 * a.count / total).round();
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: switch (i % 3) {
                                0 => BookfolioDesignTokens.primary,
                                1 => _chartSecondary,
                                _ => BookfolioDesignTokens.outlineVariant,
                              },
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              '${a.name} ($pct%)',
                              style: GoogleFonts.manrope(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.9,
                                color: BookfolioDesignTokens.onSurfaceVariant,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
              ],
            );

            final bars = _buildMiniBarChart(authors, total);
            if (wide) {
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 5, child: left),
                  const SizedBox(width: 20),
                  Expanded(flex: 6, child: bars),
                ],
              );
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                left,
                const SizedBox(height: 22),
                SizedBox(height: 140, child: bars),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildMiniBarChart(List<PersonalLibraryAuthorTop> authors, int total) {
    if (authors.isEmpty || total <= 0) {
      return const SizedBox.shrink();
    }
    final top = authors.take(7).toList();
    final maxC = top.map((e) => e.count).reduce(math.max);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: top.asMap().entries.map((e) {
        final i = e.key;
        final a = e.value;
        final h = maxC > 0 ? (a.count / maxC).clamp(0.15, 1.0) : 1.0;
        final color = switch (i % 3) {
          1 => BookfolioDesignTokens.primary,
          2 => _chartSecondary,
          _ => BookfolioDesignTokens.surfaceContainerHigh,
        };
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 280),
              height: 120 * h,
              decoration: BoxDecoration(
                color: color,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(BookfolioDesignTokens.radiusSm)),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _statRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        Expanded(
          child: Text(
            label,
            style: GoogleFonts.manrope(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.0,
              color: BookfolioDesignTokens.onSurfaceVariant,
            ),
          ),
        ),
        Text(
          value,
          style: GoogleFonts.notoSerifKr(
            fontSize: 28,
            fontWeight: FontWeight.w600,
            color: BookfolioDesignTokens.primary,
            height: 1,
          ),
        ),
      ],
    );
  }

  Widget _chip(BuildContext context, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: BookfolioDesignTokens.primaryContainer.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
      ),
      child: Text(
        text,
        style: GoogleFonts.manrope(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.4,
          color: BookfolioDesignTokens.primaryContainer,
        ),
      ),
    );
  }

  Widget _surfaceCard({required Widget child, Color? color}) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color ?? BookfolioDesignTokens.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
        border: Border.all(color: BookfolioDesignTokens.ghostOutline(0.08)),
        boxShadow: BookfolioDesignTokens.ambientShadowPrimary(),
      ),
      child: child,
    );
  }

  Widget _coverPlaceholder(BuildContext context) {
    return ColoredBox(
      color: BookfolioDesignTokens.surfaceContainerHigh,
      child: Icon(Icons.menu_book_rounded, color: BookfolioDesignTokens.onSurfaceVariant.withValues(alpha: 0.45), size: 40),
    );
  }

  Widget _underlineButton({
    required String label,
    required bool emphasized,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(2),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 2),
        child: Text(
          label,
          style: GoogleFonts.manrope(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.0,
            color: emphasized ? BookfolioDesignTokens.primary : BookfolioDesignTokens.onSurfaceVariant,
            decoration: TextDecoration.underline,
            decorationColor: emphasized
                ? BookfolioDesignTokens.primary.withValues(alpha: 0.25)
                : BookfolioDesignTokens.outlineVariant.withValues(alpha: 0.5),
          ),
        ),
      ),
    );
  }

  String _formatInt(int n) {
    final s = n.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }
}

class _TextLink extends StatelessWidget {
  const _TextLink({required this.label, required this.onTap, required this.style});

  final String label;
  final VoidCallback onTap;
  final TextStyle style;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
        child: Text(
          label,
          style: style.copyWith(decoration: TextDecoration.underline, decorationThickness: 1),
        ),
      ),
    );
  }
}

class _RecommendationCard extends StatelessWidget {
  const _RecommendationCard({
    required this.rec,
    required this.onTapSave,
    required this.onTapAdd,
  });

  final RecommendationBook rec;
  final Future<void> Function() onTapSave;
  final Future<void> Function() onTapAdd;

  @override
  Widget build(BuildContext context) {
    final cover = resolveCoverImageUrl(rec.coverUrl);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: BookfolioDesignTokens.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
        border: Border.all(color: BookfolioDesignTokens.ghostOutline(0.12)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                width: 64,
                height: 92,
                child: cover != null
                    ? Image.network(
                        cover,
                        fit: BoxFit.cover,
                        headers: kCoverImageRequestHeaders,
                        errorBuilder: (_, __, ___) =>
                            const _MiniCoverPlaceholder(),
                      )
                    : const _MiniCoverPlaceholder(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    rec.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: BookfolioDesignTokens
                        .headlineMd(
                          BookfolioDesignTokens.primary,
                          fontStyle: FontStyle.normal,
                        )
                        .copyWith(fontSize: 18),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    rec.authors.join(', ').isEmpty
                        ? '저자 미상'
                        : rec.authors.join(', '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.manrope(
                      fontSize: 11,
                      color: BookfolioDesignTokens.onSurfaceVariant,
                    ),
                  ),
                  if (rec.reasons.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      '근거: ${rec.reasons.join(' · ')}',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.manrope(
                        fontSize: 10,
                        color: BookfolioDesignTokens.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      TextButton(
                        onPressed: () => onTapSave(),
                        child: const Text('관심 저장'),
                      ),
                      const SizedBox(width: 4),
                      FilledButton(
                        onPressed: () => onTapAdd(),
                        child: const Text('서재에 추가'),
                      ),
                    ],
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

class _MiniCoverPlaceholder extends StatelessWidget {
  const _MiniCoverPlaceholder();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: BookfolioDesignTokens.surfaceContainerHigh,
      child: Center(
        child: Icon(
          Icons.menu_book_rounded,
          color: BookfolioDesignTokens.onSurfaceVariant.withValues(alpha: 0.55),
          size: 24,
        ),
      ),
    );
  }
}
