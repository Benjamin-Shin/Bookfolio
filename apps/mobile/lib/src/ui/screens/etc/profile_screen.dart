import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/models/shared_library_models.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:seogadam_mobile/src/ui/screens/etc/profile_edit_screen.dart';
import 'package:seogadam_mobile/src/ui/layout/bookfolio_navigation_drawer.dart';
import 'package:seogadam_mobile/src/util/bookfolio_web_urls.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

/// 포인트·역할·설정 메뉴·법적 고지·로그아웃 (에디토리얼 프로필 허브).
///
/// History:
/// - 2026-04-26: 「관심 카테고리 설정」 메뉴를 [ProfileEditScreen]으로 연결
/// - 2026-04-26: 드로어 「내 서가」 탭 동작 연결(루트 화면 복귀)
/// - 2026-04-13: 법적 고지 — 이용약관 제20조(탈퇴) 웹 앵커 링크
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
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  PointsBalanceResult? _points;
  MeAppProfile? _meProfile;
  PersonalLibrarySummary? _summary;
  List<SharedLibrarySummary> _sharedLibraries = const [];
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
      PersonalLibrarySummary? summary;
      List<SharedLibrarySummary> shared = const [];
      try {
        prof = await api.fetchMeProfile();
      } catch (_) {
        prof = null;
      }
      try {
        summary = await api.fetchPersonalLibrarySummary();
      } catch (_) {
        summary = null;
      }
      try {
        shared = await api.fetchSharedLibraries();
      } catch (_) {
        shared = const [];
      }
      if (!mounted) return;
      setState(() {
        _points = bal;
        _meProfile = prof;
        _summary = summary;
        _sharedLibraries = shared;
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

  Future<void> _handleLogout() async {
    final shouldLogout = await showDialog<bool>(
          context: context,
          builder: (dialogContext) => AlertDialog(
            title: const Text('로그아웃'),
            content: const Text('정말 로그아웃하시겠어요?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: const Text('취소'),
              ),
              FilledButton(
                onPressed: () => Navigator.of(dialogContext).pop(true),
                child: const Text('로그아웃'),
              ),
            ],
          ),
        ) ??
        false;
    if (!shouldLogout || !mounted) return;

    await context.read<AuthController>().signOut();
    if (!mounted) return;
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  Future<void> _openInterestCategorySettings() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => const ProfileEditScreen(),
      ),
    );
    if (!mounted) return;
    await _load();
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
    final balance = _points?.balance ?? 0;
    final (barProgress, ptsToNext) = _rewardProgress(balance);
    final ptsFormatted = NumberFormat.decimalPattern('ko').format(balance);
    final nextUnlockPoint = balance + ptsToNext;
    final createdCount =
        _sharedLibraries.where((e) => e.myRole == 'owner').length;
    final joinedCount =
        _sharedLibraries.where((e) => e.myRole != 'owner').length;
    final inviteUsed = (joinedCount * 6).clamp(0, 20);
    final email = (_meProfile?.email ?? '').trim();
    final readBooks = _summary?.completedCount ?? 0;
    final lifeBooks = _summary?.lifeBookCount ?? 0;

    final displayName = _meProfile?.displayName?.trim();
    final nameLine = (displayName != null && displayName.isNotEmpty)
        ? displayName
        : (loggedIn ? '서가담 회원' : '게스트');

    final list = ListView(
      physics:
          widget.embeddedInShell ? const AlwaysScrollableScrollPhysics() : null,
      padding: widget.embeddedInShell
          ? bookfolioShellTabScrollPadding(context).copyWith(top: 10)
          : const EdgeInsets.fromLTRB(16, 10, 16, 20),
      children: [
        if (!loggedIn)
          Text(
            '로그인 후 포인트와 설정을 이용할 수 있습니다.',
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Theme.of(context).colorScheme.error, fontSize: 14),
          )
        else if (_loading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 32),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_loadError != null)
          Material(
            color: Theme.of(context)
                .colorScheme
                .errorContainer
                .withValues(alpha: 0.9),
            borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusMd),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Text(
                _loadError!,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onErrorContainer,
                    fontSize: 13),
              ),
            ),
          )
        else ...[
          Container(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE7E1DB)),
            ),
            child: Row(
              children: [
                _ProfileAvatar(
                    imageUrl: _meProfile?.avatarUrl, diameter: 86, ring: true),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              nameLine,
                              style: GoogleFonts.manrope(
                                fontSize: 31 / 2,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF1D1D1B),
                              ),
                            ),
                          ),
                          OutlinedButton(
                            onPressed: () async {
                              await Navigator.of(context).push<void>(
                                MaterialPageRoute<void>(
                                  builder: (_) => const ProfileEditScreen(),
                                ),
                              );
                              if (mounted) await _load();
                            },
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Color(0xFFD5D4CF)),
                              minimumSize: const Size(84, 32),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 0),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(999)),
                            ),
                            child: Text(
                              '프로필 수정',
                              style: GoogleFonts.manrope(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF3A3A3A),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      if (email.isNotEmpty)
                        Text(
                          email,
                          style: GoogleFonts.manrope(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFF4E4E4E),
                          ),
                        ),
                      const SizedBox(height: 4),
                      Text(
                        '색을 담고, 서가를 키우는 중',
                        style: GoogleFonts.manrope(
                          fontSize: 12,
                          color: const Color(0xFF5F5F5F),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              gradient: const LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [Color(0xFF0B5932), Color(0xFF084226)],
              ),
            ),
            child: Stack(
              children: [
                Positioned(
                  right: 0,
                  top: 0,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.asset(
                      'assets/brand/600_Login_Back.png',
                      width: 120,
                      height: 88,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '내 포인트',
                      style: GoogleFonts.manrope(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white.withValues(alpha: 0.92),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${ptsFormatted}P',
                      style: GoogleFonts.manrope(
                        fontSize: 48 / 2,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '다음 해금까지 ${NumberFormat.decimalPattern('ko').format(ptsToNext)}P',
                      style: GoogleFonts.manrope(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: SizedBox(
                        height: 7,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            ColoredBox(
                                color: Colors.white.withValues(alpha: 0.22)),
                            FractionallySizedBox(
                              widthFactor: barProgress.clamp(0.0, 1.0),
                              alignment: Alignment.centerLeft,
                              child: const ColoredBox(color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const SizedBox(width: 1),
                        Text(
                          '${NumberFormat.decimalPattern('ko').format(nextUnlockPoint)}P',
                          style: GoogleFonts.manrope(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: Colors.white.withValues(alpha: 0.08)),
                      ),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      child: Row(
                        children: [
                          Expanded(
                            child: _PointBadgeTile(
                              icon: Icons.groups_2,
                              label: '모임서가',
                              value: '$createdCount / 3 사용',
                            ),
                          ),
                          Container(
                              width: 1,
                              height: 32,
                              color: Colors.white.withValues(alpha: 0.2)),
                          Expanded(
                            child: _PointBadgeTile(
                              icon: Icons.group_add,
                              label: '초대 가능',
                              value: '$inviteUsed / 20명',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '해금 가능한 기능',
            style: GoogleFonts.manrope(
              fontSize: 20 / 2,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          _UnlockTile(
            icon: Icons.library_add,
            title: '모임서가 추가 (예시)',
            subtitle: '포인트로 모임서가 수를 늘릴 수 있어요',
            unlockText: '1,500P 해금',
          ),
          _UnlockTile(
            icon: Icons.group_add,
            title: '초대 인원 확대 (예시)',
            subtitle: '모임서가에 더 많은 사람을 초대할 수 있어요',
            unlockText: '2,000P 해금',
          ),
          _UnlockTile(
            icon: Icons.wallpaper,
            title: '서가 꾸미기 (예시)',
            subtitle: '대표 이미지·테마 같은 꾸미기 기능 해금',
            unlockText: '3,000P 해금',
          ),
          const SizedBox(height: 12),
          Text(
            '내 활동',
            style: GoogleFonts.manrope(
              fontSize: 20 / 2,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _ActivityCard(
                  icon: Icons.menu_book_rounded,
                  title: '읽은 책',
                  value:
                      '${NumberFormat.decimalPattern('ko').format(readBooks)}권',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ActivityCard(
                  icon: Icons.bookmark_outline_rounded,
                  title: '인생책',
                  value:
                      '${NumberFormat.decimalPattern('ko').format(lifeBooks)}권',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ActivityCard(
                  icon: Icons.groups_2_rounded,
                  title: '참여 모임',
                  value: '$joinedCount개',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '포인트 관리',
            style: GoogleFonts.manrope(
              fontSize: 20 / 2,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          _LegalMenuTile(
            label: '포인트 내역',
            icon: Icons.receipt_long_outlined,
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('포인트 내역 화면은 준비 중입니다.')),
            ),
          ),
          _LegalMenuTile(
            label: '포인트 얻는 방법',
            icon: Icons.card_giftcard_outlined,
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('포인트 가이드는 곧 제공됩니다.')),
            ),
          ),
          _LegalMenuTile(
            label: '해금 현황',
            icon: Icons.lock_open_outlined,
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('해금 현황 화면은 준비 중입니다.')),
            ),
          ),
          const SizedBox(height: 6),
          _LegalMenuTile(
            label: '계정 설정',
            icon: Icons.settings_outlined,
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('계정 설정은 순차적으로 제공됩니다.')),
            ),
          ),
          _LegalMenuTile(
            label: '알림 설정',
            icon: Icons.notifications_none_rounded,
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('알림 설정은 곧 제공됩니다.')),
            ),
          ),
          _LegalMenuTile(
            label: '관심 카테고리 설정',
            icon: Icons.favorite_border_rounded,
            onTap: _openInterestCategorySettings,
          ),
          _LegalMenuTile(
            label: '개인정보처리방침',
            icon: Icons.privacy_tip_outlined,
            onTap: () => _openWebPath('/privacy'),
          ),
          _LegalMenuTile(
            label: '서비스 약관',
            icon: Icons.article_outlined,
            onTap: () => _openWebPath('/terms'),
          ),
          _LegalMenuTile(
            label: '로그아웃',
            icon: Icons.logout_rounded,
            onTap: _handleLogout,
          ),
          const SizedBox(height: 24),
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
      key: _scaffoldKey,
      drawer: BookfolioNavigationDrawer(
        onTapMyLibrary: () {
          Navigator.of(context).popUntil((route) => route.isFirst);
        },
        onTapSharedLibrary: () {
          Navigator.of(context).popUntil((route) => route.isFirst);
        },
      ),
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          '내 프로필',
          style: GoogleFonts.manrope(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: BookfolioDesignTokens.primary,
          ),
        ),
        leading: IconButton(
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          icon: const Icon(Icons.menu_rounded),
          tooltip: '메뉴',
        ),
        actions: [
          IconButton(
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('알림 기능은 준비 중입니다.')),
            ),
            icon: const Icon(Icons.notifications_none_rounded),
            tooltip: '알림',
          ),
        ],
      ),
      body: list,
    );
  }
}

class _LegalMenuTile extends StatelessWidget {
  const _LegalMenuTile({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
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
              Icon(icon,
                  size: 20, color: BookfolioDesignTokens.onSurfaceVariant),
              const SizedBox(width: 12),
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
              Icon(Icons.chevron_right_rounded,
                  size: 22, color: BookfolioDesignTokens.outlineVariant),
            ],
          ),
        ),
      ),
    );
  }
}

class _PointBadgeTile extends StatelessWidget {
  const _PointBadgeTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.18),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Icon(icon, size: 18, color: Colors.white),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.manrope(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              Text(
                value,
                style: GoogleFonts.manrope(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withValues(alpha: 0.9),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _UnlockTile extends StatelessWidget {
  const _UnlockTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.unlockText,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String unlockText;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          left: BorderSide(color: const Color(0xFFE7E1DB)),
          right: BorderSide(color: const Color(0xFFE7E1DB)),
          top: BorderSide(color: const Color(0xFFE7E1DB)),
        ),
      ),
      child: ListTile(
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
        leading: Icon(icon, color: BookfolioDesignTokens.primary),
        title: Text(title,
            style:
                GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle, style: GoogleFonts.manrope(fontSize: 11)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock_outline_rounded,
                size: 16, color: Color(0xFF767676)),
            const SizedBox(width: 4),
            Text(unlockText,
                style: GoogleFonts.manrope(
                    fontSize: 12, color: const Color(0xFF5C5C5C))),
            const SizedBox(width: 2),
            const Icon(Icons.chevron_right_rounded,
                size: 18, color: Color(0xFF848484)),
          ],
        ),
      ),
    );
  }
}

class _ActivityCard extends StatelessWidget {
  const _ActivityCard({
    required this.icon,
    required this.title,
    required this.value,
  });

  final IconData icon;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE7E1DB)),
      ),
      padding: const EdgeInsets.fromLTRB(10, 10, 10, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: BookfolioDesignTokens.primary,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: GoogleFonts.manrope(
              fontSize: 12,
              color: const Color(0xFF5E5E5E),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: GoogleFonts.manrope(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF1B1B1B),
            ),
          ),
        ],
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
          border: Border.all(
              color: BookfolioDesignTokens.surfaceContainerLow, width: 4),
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
        child: Icon(Icons.person,
            size: diameter * 0.45, color: scheme.onSurfaceVariant),
      ),
    );
  }
}
