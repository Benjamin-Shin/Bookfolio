import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/models/canon_book_models.dart';
import 'package:seogadam_mobile/src/models/discover_models.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/book_form_screen.dart';
import 'package:seogadam_mobile/src/util/cover_image_url.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

/// 발견 탭 등 — 캐논(비소장) 도서 상세: 구매 링크·커뮤니티 한줄평·등록 진입.
///
/// @history
/// - 2026-04-08: `canon-books` API·교보/알라딘/네이버 행
class CanonBookDetailScreen extends StatefulWidget {
  const CanonBookDetailScreen({super.key, required this.book});

  final DiscoverCommunityBook book;

  @override
  State<CanonBookDetailScreen> createState() => _CanonBookDetailScreenState();
}

class _CanonBookDetailScreenState extends State<CanonBookDetailScreen> {
  CanonBookPurchaseOffers? _offers;
  List<CanonCommunityOneLiner> _liners = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final api = context.read<LibraryController>().api;
    final id = widget.book.bookId.trim();
    if (id.isEmpty) {
      setState(() {
        _loading = false;
        _error = '도서 ID가 없습니다.';
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        api.fetchCanonBookPurchaseOffers(id),
        api.fetchCanonCommunityOneLiners(id),
      ]);
      if (!mounted) return;
      setState(() {
        _offers = results[0] as CanonBookPurchaseOffers;
        _liners = results[1] as List<CanonCommunityOneLiner>;
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

  Future<void> _openUrl(String? url) async {
    final u = url?.trim();
    if (u == null || u.isEmpty) return;
    final uri = Uri.tryParse(u);
    if (uri == null || !uri.hasScheme) return;
    if (!await canLaunchUrl(uri) || !mounted) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  void _openAddToLibrary() {
    final b = widget.book;
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

  String _priceOrDash(int? krw) {
    if (krw == null || krw <= 0) return '가격 정보 없음';
    return '${NumberFormat.decimalPattern('ko').format(krw)}원';
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.book;
    final scheme = Theme.of(context).colorScheme;
    final bottom = MediaQuery.viewPaddingOf(context).bottom + 24;
    final cover = resolveCoverImageUrl(b.coverUrl);

    return Scaffold(
      appBar: AppBar(
        title: const Text('도서 상세'),
        actions: [
          IconButton(
            tooltip: '새로고침',
            onPressed: _loading ? null : _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: EdgeInsets.fromLTRB(
                  16, 12, 16, bottom + kBookfolioShellBottomNavClearance),
              children: [
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Material(
                      color: scheme.errorContainer.withValues(alpha: 0.9),
                      borderRadius:
                          BorderRadius.circular(BookfolioDesignTokens.radiusSm),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(_error!,
                            style: TextStyle(
                                color: scheme.onErrorContainer, fontSize: 13)),
                      ),
                    ),
                  ),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: SizedBox(
                        width: 108,
                        height: 156,
                        child: cover != null
                            ? Image.network(
                                cover,
                                fit: BoxFit.cover,
                                headers: kCoverImageRequestHeaders,
                                errorBuilder: (_, __, ___) => ColoredBox(
                                    color: scheme.surfaceContainerHighest),
                              )
                            : ColoredBox(color: scheme.surfaceContainerHighest),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            b.title,
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            b.authors.join(', '),
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: scheme.onSurfaceVariant,
                                ),
                          ),
                          if (b.isbn != null && b.isbn!.trim().isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(
                              'ISBN ${b.isbn}',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: scheme.onSurfaceVariant,
                                  ),
                            ),
                          ],
                          const SizedBox(height: 8),
                          Text(
                            '${b.otherOwnerCount}명이 서가에 등록했어요',
                            style: Theme.of(context)
                                .textTheme
                                .labelMedium
                                ?.copyWith(
                                  color: scheme.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                FilledButton.icon(
                  onPressed: _openAddToLibrary,
                  icon: const Icon(Icons.library_add_outlined),
                  label: const Text('내 서가에 담기'),
                ),
                const SizedBox(height: 24),
                Text(
                  '구매·가격 (외부 사이트)',
                  style:
                      BookfolioDesignTokens.labelMd(scheme.onSurface).copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '알라딘·네이버·교보문고로 이동합니다. 가격은 참고용이며 서점 사이트에서 확인해 주세요.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                        height: 1.35,
                      ),
                ),
                const SizedBox(height: 12),
                if (_offers != null) ...[
                  _PurchaseTile(
                    title: '알라딘',
                    subtitle: _priceOrDash(_offers!.aladinPriceKrw),
                    icon: Icons.local_mall_outlined,
                    onTap: () => _openUrl(_offers!.aladinUrl),
                  ),
                  _PurchaseTile(
                    title: '네이버 책',
                    subtitle: _offers!.naverUrl == null
                        ? '링크 없음'
                        : _priceOrDash(_offers!.naverPriceKrw),
                    icon: Icons.menu_book_outlined,
                    enabled: _offers!.naverUrl != null &&
                        _offers!.naverUrl!.trim().isNotEmpty,
                    onTap: () => _openUrl(_offers!.naverUrl),
                  ),
                  _PurchaseTile(
                    title: '교보문고 검색',
                    subtitle: '통합 검색 결과로 이동',
                    icon: Icons.storefront_outlined,
                    onTap: () => _openUrl(_offers!.kyoboUrl),
                  ),
                  if (_offers!.cached)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        '가격·링크는 서버에 잠시 저장된 정보입니다. 갱신: ${_offers!.fetchedAt}',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: scheme.onSurfaceVariant
                                  .withValues(alpha: 0.85),
                            ),
                      ),
                    ),
                ],
                const SizedBox(height: 28),
                Text(
                  '회원 한줄평',
                  style:
                      BookfolioDesignTokens.labelMd(scheme.onSurface).copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 8),
                if (_liners.isEmpty)
                  Text(
                    '아직 한줄평이 없어요.',
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: scheme.onSurfaceVariant),
                  )
                else
                  ..._liners.map(
                    (e) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Material(
                        color:
                            scheme.surfaceContainerHigh.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(
                            BookfolioDesignTokens.radiusSm),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                e.displayName?.trim().isNotEmpty == true
                                    ? e.displayName!
                                    : '회원',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelLarge
                                    ?.copyWith(
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                              const SizedBox(height: 6),
                              Text(e.body,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(height: 1.35)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}

class _PurchaseTile extends StatelessWidget {
  const _PurchaseTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
    this.enabled = true,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
        child: InkWell(
          onTap: enabled ? onTap : null,
          borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Icon(icon,
                    color: enabled
                        ? scheme.primary
                        : scheme.onSurfaceVariant.withValues(alpha: 0.4)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context)
                            .textTheme
                            .titleSmall
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: scheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.open_in_new_rounded,
                  size: 18,
                  color: enabled
                      ? scheme.onSurfaceVariant
                      : scheme.onSurfaceVariant.withValues(alpha: 0.35),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
