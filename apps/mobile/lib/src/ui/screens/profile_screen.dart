import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/onboarding_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/profile_edit_screen.dart';
import 'package:seogadam_mobile/src/util/bookfolio_web_urls.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

/// 포인트·역할·설정 메뉴·법적 고지·로그아웃 (에디토리얼 프로필 허브).
///
/// History:
/// - 2026-04-06: 「온보딩 가이드」 — [OnboardingScreen] 재보기
/// - 2026-04-05: HTML 목업(Bibliotheca Archive) 정렬 — 카드형 포인트·섹션 메뉴·[ProfileEditScreen] 분리
/// - 2026-04-02: 성별·생년월일·통계 공개 동의 (`/api/me/profile`)
/// - 2026-04-03: `embeddedInShell` — 메인 하단 탭에서 본문만(쉘 앱바 공용)
/// - 2026-03-29: 웹과 동일 탈퇴 확인 후 `deleteAccount`·`signOut`
/// - 2026-03-28: `ThemeController`로 화면 모드·색감 선택
/// - 2026-03-28: `LibraryController.api`로 잔액 조회 연동
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, this.embeddedInShell = false});

  /// `true`이면 [Scaffold]/자체 앱바 없이 본문만 렌더링( [MainShellScreen] 탭).
  final bool embeddedInShell;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  PointsBalanceResult? _points;
  MeAppProfile? _meProfile;
  String? _loadError;
  bool _loading = true;

  static const _rewardBlock = 500;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final api = context.read<LibraryController>().api;
      final bal = await api.fetchPointsBalance();
      MeAppProfile? prof;
      try {
        prof = await api.fetchMeProfile();
      } catch (_) {
        prof = null;
      }
      if (!mounted) return;
      setState(() {
        _points = bal;
        _meProfile = prof;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadError = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _openWebPath(String path) async {
    final uri = bookfolioWebPageUri(path);
    if (!uri.hasScheme || uri.host.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('서가담 API 주소가 설정되지 않았습니다.')),
        );
      }
      return;
    }
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('브라우저를 열 수 없습니다.')),
      );
    }
  }

  /// 현재 포인트 구간 내 진행률(0~1)과 다음 보상까지 남은 포인트.
  (double progress, int ptsToNext) _rewardProgress(int balance) {
    final r = balance % _rewardBlock;
    if (balance == 0) {
      return (0.0, _rewardBlock);
    }
    if (r == 0) {
      return (1.0, _rewardBlock);
    }
    return (r / _rewardBlock, _rewardBlock - r);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final loggedIn = auth.isAuthenticated;
    final scheme = Theme.of(context).colorScheme;
    final balance = _points?.balance ?? 0;
    final (barProgress, ptsToNext) = _rewardProgress(balance);
    final pctLabel = (barProgress * 100).round();
    final ptsFormatted = NumberFormat.decimalPattern('ko').format(balance);

    final displayName = _meProfile?.displayName?.trim();
    final nameLine = (displayName != null && displayName.isNotEmpty)
        ? displayName
        : (loggedIn ? '서가담 회원' : '게스트');

    final list = ListView(
      physics: widget.embeddedInShell ? const AlwaysScrollableScrollPhysics() : null,
      padding: widget.embeddedInShell
          ? bookfolioShellTabScrollPadding(context).copyWith(top: 8)
          : const EdgeInsets.fromLTRB(24, 8, 24, 24),
      children: [
        const SizedBox(height: 8),
        Center(
          child: _ProfileAvatar(
            imageUrl: _meProfile?.avatarUrl,
            diameter: 128,
            ring: true,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          nameLine,
          textAlign: TextAlign.center,
          style: GoogleFonts.newsreader(
            fontSize: 36,
            height: 1.1,
            fontWeight: FontWeight.w700,
            color: BookfolioDesignTokens.primary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          _points?.vipActive == true ? '프리미엄 큐레이터' : '멤버',
          textAlign: TextAlign.center,
          style: GoogleFonts.manrope(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 12 * 0.05,
            color: scheme.secondary,
          ),
        ),
        const SizedBox(height: 48),
        if (!loggedIn)
          Text(
            '로그인 후 포인트와 설정을 이용할 수 있습니다.',
            textAlign: TextAlign.center,
            style: TextStyle(color: scheme.error, fontSize: 14),
          )
        else if (_loading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 32),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_loadError != null)
          Material(
            color: scheme.errorContainer.withValues(alpha: 0.9),
            borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusMd),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Text(
                _loadError!,
                style: TextStyle(color: scheme.onErrorContainer, fontSize: 13),
              ),
            ),
          )
        else ...[
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: BookfolioDesignTokens.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusMd),
              border: Border.all(color: BookfolioDesignTokens.ghostOutline(0.1)),
              boxShadow: BookfolioDesignTokens.ambientShadowPrimary(),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '큐레이터 포인트',
                            style: GoogleFonts.manrope(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1.2,
                              color: BookfolioDesignTokens.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                ptsFormatted,
                                style: GoogleFonts.newsreader(
                                  fontSize: 30,
                                  fontWeight: FontWeight.w700,
                                  color: BookfolioDesignTokens.primary,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'pts',
                                style: GoogleFonts.manrope(
                                  fontSize: 14,
                                  color: BookfolioDesignTokens.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Flexible(
                      child: Text(
                        '다음 단계: 마스터 아키비스트',
                        textAlign: TextAlign.right,
                        style: GoogleFonts.manrope(
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                          color: BookfolioDesignTokens.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: SizedBox(
                    height: 6,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        ColoredBox(color: BookfolioDesignTokens.surfaceContainerHigh),
                        FractionallySizedBox(
                          widthFactor: barProgress.clamp(0.0, 1.0),
                          alignment: Alignment.centerLeft,
                          child: const DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: BookfolioDesignTokens.inkGradient,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '$pctLabel% 진행',
                      style: GoogleFonts.manrope(
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 0.2,
                        color: BookfolioDesignTokens.onSurfaceVariant,
                      ),
                    ),
                    Text(
                      '리워드까지 ${NumberFormat.decimalPattern('ko').format(ptsToNext)} pts',
                      style: GoogleFonts.manrope(
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 0.2,
                        color: BookfolioDesignTokens.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
        if (loggedIn && !_loading && _loadError == null) ...[
          const SizedBox(height: 48),
          Text(
            '계정 설정',
            style: GoogleFonts.newsreader(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: BookfolioDesignTokens.primary,
            ),
          ),
          const SizedBox(height: 8),
          _ProfileMenuTile(
            icon: Icons.person_outline,
            label: '프로필 편집',
            onTap: () async {
              await Navigator.of(context).push<void>(
                MaterialPageRoute<void>(builder: (_) => const ProfileEditScreen()),
              );
              if (mounted) await _load();
            },
          ),
          _ProfileMenuTile(
            icon: Icons.waving_hand_outlined,
            label: '온보딩 가이드',
            onTap: () {
              Navigator.of(context).push<void>(
                MaterialPageRoute<void>(
                  builder: (_) => const OnboardingScreen(reviewOnly: true),
                ),
              );
            },
          ),
          _ProfileMenuTile(
            icon: Icons.notifications_active_outlined,
            label: '알림',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('알림 설정은 곧 제공됩니다.')),
              );
            },
          ),
          _ProfileMenuTile(
            icon: Icons.verified_user_outlined,
            label: '보안',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('비밀번호 변경 등은 서가담 웹에서 진행해 주세요.')),
              );
            },
          ),
          const SizedBox(height: 40),
          Text(
            '법적 고지',
            style: GoogleFonts.newsreader(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: BookfolioDesignTokens.primary,
            ),
          ),
          const SizedBox(height: 8),
          _LegalMenuTile(
            label: '개인정보처리방침',
            onTap: () => _openWebPath('/privacy'),
          ),
          _LegalMenuTile(
            label: '이용약관',
            onTap: () => _openWebPath('/terms'),
          ),
          _LegalMenuTile(
            label: '쿠키정책',
            onTap: () => _openWebPath('/cookies'),
          ),
          const SizedBox(height: 40),
          Center(
            child: TextButton(
              onPressed: () => context.read<AuthController>().signOut(),
              style: TextButton.styleFrom(
                foregroundColor: scheme.error,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.logout, size: 18, color: scheme.error),
                  const SizedBox(width: 8),
                  Text(
                    '로그아웃',
                    style: GoogleFonts.manrope(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 24),
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
        title: const Text('프로필'),
        actions: [
          IconButton(
            onPressed: loggedIn ? _load : null,
            icon: const Icon(Icons.refresh),
            tooltip: '새로 고침',
          ),
        ],
      ),
      body: list,
    );
  }
}

class _ProfileMenuTile extends StatelessWidget {
  const _ProfileMenuTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 18),
          child: Row(
            children: [
              Icon(icon, size: 22, color: BookfolioDesignTokens.onSurfaceVariant),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  label,
                  style: GoogleFonts.manrope(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: BookfolioDesignTokens.onSurface,
                  ),
                ),
              ),
              Icon(Icons.chevron_right, color: BookfolioDesignTokens.outlineVariant, size: 22),
            ],
          ),
        ),
      ),
    );
  }
}

class _LegalMenuTile extends StatelessWidget {
  const _LegalMenuTile({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 18),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: GoogleFonts.manrope(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: BookfolioDesignTokens.onSurface,
                  ),
                ),
              ),
              Icon(Icons.open_in_new, size: 20, color: BookfolioDesignTokens.outlineVariant),
            ],
          ),
        ),
      ),
    );
  }
}

/// 앱바·헤더용 원형 아바타.
class ProfileToolbarAvatar extends StatelessWidget {
  const ProfileToolbarAvatar({super.key, this.imageUrl, this.size = 40});

  final String? imageUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    return _ProfileAvatar(imageUrl: imageUrl, diameter: size, ring: false);
  }
}

class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({
    required this.imageUrl,
    required this.diameter,
    required this.ring,
  });

  final String? imageUrl;
  final double diameter;
  final bool ring;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final url = imageUrl?.trim();

    if (ring) {
      return Container(
        width: diameter,
        height: diameter,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: BookfolioDesignTokens.surfaceContainerLow, width: 4),
          boxShadow: [
            BoxShadow(
              color: BookfolioDesignTokens.primary.withValues(alpha: 0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipOval(child: _innerFace(scheme, url)),
      );
    }

    return SizedBox(
      width: diameter,
      height: diameter,
      child: DecoratedBox(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: BookfolioDesignTokens.ghostOutline(0.15)),
        ),
        child: ClipOval(child: _innerFace(scheme, url)),
      ),
    );
  }

  Widget _innerFace(ColorScheme scheme, String? url) {
    if (url != null && url.isNotEmpty) {
      return Image.network(
        url,
        width: diameter,
        height: diameter,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _avatarFallback(scheme),
      );
    }
    return _avatarFallback(scheme);
  }

  Widget _avatarFallback(ColorScheme scheme) {
    return ColoredBox(
      color: scheme.surfaceContainerHigh,
      child: Center(
        child: Icon(Icons.person, size: diameter * 0.45, color: scheme.onSurfaceVariant),
      ),
    );
  }
}
