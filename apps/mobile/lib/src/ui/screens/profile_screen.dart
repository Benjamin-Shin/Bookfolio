import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/state/theme_controller.dart';
import 'package:bookfolio_mobile/src/theme/bookfolio_themes.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 포인트 잔액·VIP 표시, 테마 선택, 로그아웃.
///
/// History:
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
          ],
        ],
      ),
    );
  }
}
