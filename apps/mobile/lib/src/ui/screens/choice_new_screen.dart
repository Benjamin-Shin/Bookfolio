import 'package:bookfolio_mobile/src/models/aladin_bestseller_models.dart';
import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/ui/widgets/main_hub_top_nav.dart';
import 'package:bookfolio_mobile/src/util/cover_image_url.dart';
import 'package:bookfolio_mobile/src/util/today_list_caption.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

/// 초이스 신간(알라딘 신간·피드) 목록 화면.
///
/// History:
/// - 2026-03-26: 화면·앱바 제목 표기 「초이스 시간」
/// - 2026-03-26: API·쿼리 노출 제거, 오늘 일자 기준 안내 문구·`MainHubTopNavBar`
/// - 2026-03-25: 웹 `GET /api/me/aladin-item-new` 와 동일 데이터 표시
class ChoiceNewScreen extends StatefulWidget {
  const ChoiceNewScreen({super.key});

  @override
  State<ChoiceNewScreen> createState() => _ChoiceNewScreenState();
}

class _ChoiceNewScreenState extends State<ChoiceNewScreen> {
  final BookfolioApi _api = BookfolioApi();
  AladinBestsellerFeed? _feed;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthController>();
    _api.accessToken = () => auth.session?.accessToken;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final feed = await _api.fetchAladinItemNewFeed();
      if (mounted) {
        setState(() {
          _feed = feed;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _openAladin(String url) async {
    final uri = Uri.tryParse(url.trim());
    if (uri == null || !uri.hasScheme) return;
    final ok = await canLaunchUrl(uri);
    if (!ok || !mounted) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          '초이스 신간',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w700,
            color: const Color(0xFF3E342C),
          ),
        ),
        backgroundColor: const Color(0xFFEDE4D8),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const MainHubTopNavBar(current: MainHubTab.choice),
          Expanded(
            child: DecoratedBox(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0xFFF5EDE2),
                    Color(0xFFE8DCC8),
                  ],
                ),
              ),
              child: RefreshIndicator(
                onRefresh: _load,
                color: colorScheme.primary,
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : _error != null
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.all(24),
                            children: [
                              Material(
                                color: colorScheme.errorContainer
                                    .withValues(alpha: 0.9),
                                borderRadius: BorderRadius.circular(12),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Text(
                                    _error!,
                                    style: TextStyle(
                                        color: colorScheme.onErrorContainer,
                                        fontSize: 14),
                                  ),
                                ),
                              ),
                            ],
                          )
                        : _buildList(context, _feed!),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildList(BuildContext context, AladinBestsellerFeed feed) {
    if (feed.items.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [
          Text(todayChoiceNewListCaption(),
              style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 12),
          Text(
            '표시할 도서가 없습니다.',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: const Color(0xFF6B5B4D)),
          ),
        ],
      );
    }

    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  todayChoiceNewListCaption(),
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: const Color(0xFF5C4A3A),
                        fontWeight: FontWeight.w600,
                        height: 1.35,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${feed.items.length}권',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: const Color(0xFF7A6A5C),
                      ),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final item = feed.items[index];
                return _ChoiceNewRow(
                  rank: index + 1,
                  item: item,
                  onOpenAladin: item.link.isNotEmpty
                      ? () => _openAladin(item.link)
                      : null,
                );
              },
              childCount: feed.items.length,
            ),
          ),
        ),
      ],
    );
  }
}

class _ChoiceNewRow extends StatelessWidget {
  const _ChoiceNewRow({
    required this.rank,
    required this.item,
    required this.onOpenAladin,
  });

  final int rank;
  final AladinBestsellerItem item;
  final VoidCallback? onOpenAladin;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cover = resolveCoverImageUrl(item.cover);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: const Color(0xFFFFFBF7),
        elevation: 1,
        shadowColor: Colors.black26,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onOpenAladin,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 56,
                  child: Text(
                    '$rank',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFFB3582F),
                    ),
                  ),
                ),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: SizedBox(
                    width: 56,
                    height: 84,
                    child: cover != null
                        ? Image.network(
                            cover,
                            fit: BoxFit.cover,
                            headers: kCoverImageRequestHeaders,
                            errorBuilder: (_, __, ___) =>
                                const ColoredBox(color: Color(0xFFE8E0D8)),
                          )
                        : const ColoredBox(color: Color(0xFFE8E0D8)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title.isNotEmpty ? item.title : '(제목 없음)',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          height: 1.25,
                          color: const Color(0xFF3E342C),
                        ),
                      ),
                      if (item.author.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          item.author,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall
                              ?.copyWith(color: const Color(0xFF6B5B4D)),
                        ),
                      ],
                      if (item.publisher.isNotEmpty ||
                          item.pubDate.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          [item.publisher, item.pubDate]
                              .where((s) => s.isNotEmpty)
                              .join(' · '),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: const Color(0xFF8A7B6E),
                            fontSize: 12,
                          ),
                        ),
                      ],
                      if (item.priceSales != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          '${item.priceSales!.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',')}원',
                          style: theme.textTheme.labelLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF3E342C),
                          ),
                        ),
                      ],
                      if (onOpenAladin != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          '자세히 보기',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
