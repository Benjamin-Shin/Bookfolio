import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/state/theme_controller.dart';
import 'package:bookfolio_mobile/src/theme/bookfolio_themes.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 포인트 잔액·VIP 표시, 테마 선택, 로그아웃, 회원 탈퇴.
///
/// History:
/// - 2026-03-29: 웹과 동일 탈퇴 확인 후 `deleteAccount`·`signOut`
/// - 2026-03-28: `ThemeController`로 화면 모드·색감 선택
/// - 2026-03-28: `LibraryController.api`로 잔액 조회 연동
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  PointsBalanceResult? _points;
  String? _loadError;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _confirmDeleteAccount(BuildContext context) async {
    var loading = false;
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) {
          Future<void> onConfirm() async {
            setLocal(() => loading = true);
            try {
              final api = context.read<LibraryController>().api;
              await api.deleteAccount();
              if (!context.mounted) return;
              Navigator.of(ctx).pop();
              await context.read<AuthController>().signOut();
            } on BookfolioApiException catch (e) {
              if (!ctx.mounted) return;
              setLocal(() => loading = false);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(e.message)),
              );
            } catch (e) {
              if (!ctx.mounted) return;
              setLocal(() => loading = false);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('네트워크 오류가 발생했습니다. ($e)')),
              );
            }
          }

          return AlertDialog(
            title: const Text('회원 탈퇴'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '탈퇴를 확인하면 아래 정보가 물리적으로 삭제되며 복구할 수 없습니다.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '· 보유 포인트 및 포인트 원장 전체\n'
                    '· 내 서재(소장 도서), 메모, 독서 이벤트 기록, 한줄평\n'
                    '· 내가 만든 공동서재 — 다른 멤버가 없으면 탈퇴와 함께 삭제되고, 있으면 탈퇴 전 소유권 이전 필요\n'
                    '· 다른 사람 서재에 참여 중이던 멤버십\n'
                    '· 프로필·계정(로그인) 정보',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 12),
                  Material(
                    color: Theme.of(context).colorScheme.tertiaryContainer.withValues(alpha: 0.65),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.all(10),
                      child: Text(
                        '소유한 공동서재에 다른 멤버가 있으면 탈퇴할 수 없습니다. '
                        '해당 서재 화면에서 소유권을 다른 멤버에게 이전한 뒤 탈퇴해 주세요. '
                        '본인만 남은 공동서재는 별도 삭제 없이 탈퇴 시 함께 정리됩니다.',
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    '여러 사용자가 쓰는 공유 서지(books)는 삭제되지 않을 수 있습니다.',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: loading ? null : () => Navigator.of(ctx).pop(),
                child: const Text('취소'),
              ),
              FilledButton(
                onPressed: loading ? null : onConfirm,
                style: FilledButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.error,
                  foregroundColor: Theme.of(context).colorScheme.onError,
                ),
                child: loading
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Theme.of(ctx).colorScheme.onError,
                        ),
                      )
                    : const Text('탈퇴 확인'),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final api = context.read<LibraryController>().api;
      final result = await api.fetchPointsBalance();
      if (!mounted) return;
      setState(() {
        _points = result;
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

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final themeCtrl = context.watch<ThemeController>();
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final loggedIn = auth.isAuthenticated;

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
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('화면 설정', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(
            '화면 모드',
            style: textTheme.labelLarge?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 6),
          SegmentedButton<ThemeMode>(
            segments: const [
              ButtonSegment(
                value: ThemeMode.system,
                label: Text('시스템'),
                icon: Icon(Icons.brightness_auto, size: 18),
              ),
              ButtonSegment(
                value: ThemeMode.light,
                label: Text('라이트'),
                icon: Icon(Icons.light_mode_outlined, size: 18),
              ),
              ButtonSegment(
                value: ThemeMode.dark,
                label: Text('다크'),
                icon: Icon(Icons.dark_mode_outlined, size: 18),
              ),
            ],
            emptySelectionAllowed: false,
            selected: {themeCtrl.themeMode},
            onSelectionChanged: (next) async {
              if (next.isEmpty) return;
              await themeCtrl.setThemeMode(next.first);
            },
          ),
          const SizedBox(height: 16),
          Text(
            '색감(악센트)',
            style: textTheme.labelLarge?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 6),
          SegmentedButton<BookfolioPalette>(
            segments: const [
              ButtonSegment(
                value: BookfolioPalette.warm,
                label: Text('웜'),
                icon: Icon(Icons.water_drop_outlined, size: 18),
              ),
              ButtonSegment(
                value: BookfolioPalette.sage,
                label: Text('세이지'),
                icon: Icon(Icons.forest_outlined, size: 18),
              ),
            ],
            emptySelectionAllowed: false,
            selected: {themeCtrl.palette},
            onSelectionChanged: (next) async {
              if (next.isEmpty) return;
              await themeCtrl.setPalette(next.first);
            },
          ),
          const SizedBox(height: 28),
          if (!loggedIn)
            Text(
              '로그인 후 이용할 수 있습니다.',
              style: TextStyle(color: colorScheme.error),
            )
          else ...[
            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_loadError != null)
              Material(
                color: colorScheme.errorContainer.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Text(
                    _loadError!,
                    style: TextStyle(
                      color: colorScheme.onErrorContainer,
                      fontSize: 13,
                    ),
                  ),
                ),
              )
            else if (_points != null) ...[
              Card(
                child: ListTile(
                  leading: Icon(Icons.stars_outlined, color: colorScheme.primary),
                  title: const Text('포인트'),
                  subtitle: Text(
                    '${_points!.balance} P',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Card(
                child: ListTile(
                  leading: Icon(
                    _points!.vipActive
                        ? Icons.workspace_premium
                        : Icons.workspace_premium_outlined,
                    color: colorScheme.primary,
                  ),
                  title: const Text('VIP'),
                  subtitle: Text(_points!.vipActive ? '활성' : '비활성'),
                ),
              ),
            ],
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => context.read<AuthController>().signOut(),
              icon: const Icon(Icons.logout),
              style: FilledButton.styleFrom(
                backgroundColor: colorScheme.error,
                foregroundColor: colorScheme.onError,
              ),
              label: const Text('로그아웃'),
            ),
            const SizedBox(height: 16),
            Text(
              '계정을 삭제하면 데이터가 모두 사라집니다.',
              style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 4),
            TextButton(
              onPressed: () => _confirmDeleteAccount(context),
              style: TextButton.styleFrom(
                foregroundColor: colorScheme.error,
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                alignment: Alignment.centerLeft,
              ),
              child: const Text('회원 탈퇴…'),
            ),
          ],
        ],
      ),
    );
  }
}
