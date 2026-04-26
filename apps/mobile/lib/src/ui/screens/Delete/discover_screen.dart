import 'package:seogadam_mobile/src/models/aladin_bestseller_models.dart';
import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/models/discover_models.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/Delete/bestseller_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/book_form_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/Delete/canon_book_detail_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/Delete/choice_new_screen.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:seogadam_mobile/src/util/today_list_caption.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

/// 메인 「발견」탭: 베스트/신간 미리보기·커뮤니티 등록 도서.
///
/// History:
/// - 2026-04-05: Stitch1 발견 허브 — 알라딘 TOP 30·`discover/community-books`·등록 폼 프리필
/// - 2026-04-08: 커뮤니티 도서 탭=비소장 상세·구매 링크, 길게 누르면 바로 등록 폼
class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key, this.embeddedInShell = false});

  final bool embeddedInShell;

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  static const _previewCount = 30;

  AladinBestsellerFeed? _bestseller;
  AladinBestsellerFeed? _itemNew;
  List<DiscoverCommunityBook> _community = const [];
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
    try {
      final results = await Future.wait([
        api.fetchAladinBestsellerFeed(),
        api.fetchAladinItemNewFeed(),
        api.fetchDiscoverCommunityBooks(limit: _previewCount),
      ]);
      if (!mounted) return;
      setState(() {
        _bestseller = results[0] as AladinBestsellerFeed;
        _itemNew = results[1] as AladinBestsellerFeed;
        _community = results[2] as List<DiscoverCommunityBook>;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _openAladin(String url) async {
    final uri = Uri.tryParse(url.trim());
    if (uri == null || !uri.hasScheme) return;
    if (!await canLaunchUrl(uri) || !mounted) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  void _openAddFromCommunity(DiscoverCommunityBook b) {
    final isbn = b.isbn?.trim();
    Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => BookFormScreen(
          prefill: BookLookupResult(
            isbn: isbn != null && isbn.isNotEmpty ? isbn : '',
            title: b.title,
            authors: b.authors,
            publisher: b.publisher,
            publishedDate: b.publishedDate,
            coverUrl: b.coverUrl,
            description: b.description,
            priceKrw: b.priceKrw,
            source: 'catalog',
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom +
        kBookfolioShellBottomNavClearance;

    final Widget body = _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.fromLTRB(20, 24, 20, bottomPad),
                children: [
                  Text(_error!,
                      style: TextStyle(color: scheme.error, fontSize: 14)),
                  const SizedBox(height: 16),
                  FilledButton(onPressed: _load, child: const Text('다시 시도')),
                ],
              )
            : _buildContent(context, bottomPad);

    final decorated = DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color.lerp(scheme.surface, scheme.primaryContainer, 0.12)!,
            scheme.surfaceContainerLow,
          ],
        ),
      ),
      child: RefreshIndicator(
        onRefresh: _load,
        color: scheme.primary,
        child: body,
      ),
    );

    if (widget.embeddedInShell) {
      return SizedBox.expand(child: decorated);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('발견'),
        surfaceTintColor: Colors.transparent,
      ),
      body: decorated,
    );
  }

  Widget _buildContent(BuildContext context, double bottomPad) {
    final best = _bestseller!;
    final neu = _itemNew!;
    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
            child: Text(
              '오늘의 큐레이션',
              style: BookfolioDesignTokens.headlineMd(
                  BookfolioDesignTokens.primary,
                  fontStyle: FontStyle.normal),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: _sectionHeader(
            context,
            title: '베스트셀러',
            actionLabel: '더보기',
            onAction: () {
              Navigator.of(context).push<void>(
                MaterialPageRoute<void>(
                    builder: (_) => const BestsellerScreen()),
              );
            },
            subtitle: todayBestsellerListCaption(),
          ),
        ),
        SliverToBoxAdapter(
          child: _horizontalAladinStrip(
            context,
            best.items.take(_previewCount).toList(),
            (item) =>
                item.link.isNotEmpty ? () => _openAladin(item.link) : null,
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 8)),
        SliverToBoxAdapter(
          child: _sectionHeader(
            context,
            title: '초이스 신간',
            actionLabel: '더보기',
            onAction: () {
              Navigator.of(context).push<void>(
                MaterialPageRoute<void>(
                    builder: (_) => const ChoiceNewScreen()),
              );
            },
          ),
        ),
        SliverToBoxAdapter(
          child: _horizontalAladinStrip(
            context,
            neu.items.take(_previewCount).toList(),
            (item) =>
                item.link.isNotEmpty ? () => _openAladin(item.link) : null,
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 16)),
        SliverToBoxAdapter(
          child: _sectionHeader(
            context,
            title: '다른 회원이 추가한 도서',
            subtitle:
                '내 서가에는 없고 다른 회원이 등록한 종이책이에요. 탭하면 상세·구매 링크·한줄평, 길게 누르면 바로 등록할 수 있어요.',
          ),
        ),
        SliverToBoxAdapter(
          child: _community.isEmpty
              ? Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Text(
                    '아직 표시할 책이 없습니다.',
                    style: GoogleFonts.manrope(
                      fontSize: 14,
                      color: BookfolioDesignTokens.onSurfaceVariant,
                    ),
                  ),
                )
              : _horizontalCommunityStrip(context),
        ),
        SliverToBoxAdapter(child: SizedBox(height: 24 + bottomPad)),
      ],
    );
  }

  Widget _sectionHeader(
    BuildContext context, {
    required String title,
    String? actionLabel,
    VoidCallback? onAction,
    String? subtitle,
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 12, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: BookfolioDesignTokens.labelMd(
                          BookfolioDesignTokens.onSurface)
                      .copyWith(
                    fontSize: 13,
                    letterSpacing: 0.6,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              if (actionLabel != null && onAction != null)
                TextButton(
                  onPressed: onAction,
                  child: Text(actionLabel,
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
            ],
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: GoogleFonts.manrope(
                fontSize: 12,
                height: 1.35,
                color: BookfolioDesignTokens.onSurfaceVariant
                    .withValues(alpha: 0.85),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _horizontalAladinStrip(
    BuildContext context,
    List<AladinBestsellerItem> items,
    VoidCallback? Function(AladinBestsellerItem item) onTapFor,
  ) {
    if (items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Text(
          '목록이 비어 있어요.',
          style: GoogleFonts.manrope(
              fontSize: 14, color: BookfolioDesignTokens.onSurfaceVariant),
        ),
      );
    }
    return SizedBox(
      height: 220,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, i) {
          final item = items[i];
          final onTap = onTapFor(item);
          final cover = resolveCoverImageUrl(item.cover);
          return SizedBox(
            width: 118,
            child: Material(
              color: Theme.of(context).colorScheme.surfaceContainerLow,
              borderRadius:
                  BorderRadius.circular(BookfolioDesignTokens.radiusSm),
              child: InkWell(
                onTap: onTap,
                borderRadius:
                    BorderRadius.circular(BookfolioDesignTokens.radiusSm),
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: cover != null
                              ? Image.network(
                                  cover,
                                  fit: BoxFit.cover,
                                  headers: kCoverImageRequestHeaders,
                                  errorBuilder: (_, __, ___) => ColoredBox(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .surfaceContainerHighest),
                                )
                              : ColoredBox(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .surfaceContainerHighest),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        item.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.manrope(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            height: 1.25),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _horizontalCommunityStrip(BuildContext context) {
    return SizedBox(
      height: 240,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _community.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, i) {
          final b = _community[i];
          final cover = resolveCoverImageUrl(b.coverUrl);
          return SizedBox(
            width: 124,
            child: Material(
              color: Theme.of(context).colorScheme.surfaceContainerLow,
              borderRadius:
                  BorderRadius.circular(BookfolioDesignTokens.radiusSm),
              child: InkWell(
                onTap: () {
                  Navigator.of(context).push<void>(
                    MaterialPageRoute<void>(
                        builder: (_) => CanonBookDetailScreen(book: b)),
                  );
                },
                onLongPress: () => _openAddFromCommunity(b),
                borderRadius:
                    BorderRadius.circular(BookfolioDesignTokens.radiusSm),
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: cover != null
                              ? Image.network(
                                  cover,
                                  fit: BoxFit.cover,
                                  headers: kCoverImageRequestHeaders,
                                  errorBuilder: (_, __, ___) => ColoredBox(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .surfaceContainerHighest),
                                )
                              : ColoredBox(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .surfaceContainerHighest),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        b.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.manrope(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            height: 1.25),
                      ),
                      Text(
                        '${b.otherOwnerCount}명 소장',
                        style: GoogleFonts.manrope(
                          fontSize: 10,
                          color: BookfolioDesignTokens.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
