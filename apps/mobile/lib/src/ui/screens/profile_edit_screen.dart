import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/state/theme_controller.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 프로필 편집: 화면 설정·인구통계·포인트·회원 탈퇴.
///
/// History:
/// - 2026-04-12: 성별 `DropdownButtonFormField` — `value` → `initialValue`, 새로고침 반영용 `ValueKey`
/// - 2026-04-12: 웜/세이지 팔레트 선택 제거 — 디자인 단일 소스
/// - 2026-04-06: 연간 완독 목표(권) — `app_profiles.annual_reading_goal`
/// - 2026-04-05: [ProfileScreen] 목업 분리 — 메인 프로필은 카드형, 상세 편집은 본 화면으로 이동
class ProfileEditScreen extends StatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  State<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<ProfileEditScreen> {
  PointsBalanceResult? _points;
  MeAppProfile? _meProfile;
  String? _genderChoice;
  String? _birthDateIso;
  bool _genderPublic = false;
  bool _birthDatePublic = false;
  bool _demographicsSaving = false;
  String? _demographicsError;
  String? _loadError;
  bool _loading = true;
  final _annualGoalCtrl = TextEditingController();

  static const _allowedGenders = {'male', 'female', 'other', 'unknown'};

  String? get _normalizedGenderChoice {
    final g = _genderChoice;
    if (g == null || g.isEmpty) return null;
    return _allowedGenders.contains(g) ? g : null;
  }

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  @override
  void dispose() {
    _annualGoalCtrl.dispose();
    super.dispose();
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
                    '· 내 서가(소장 도서), 메모, 독서 이벤트 기록, 한줄평\n'
                    '· 내가 만든 공동서가 — 다른 멤버가 없으면 탈퇴와 함께 삭제되고, 있으면 탈퇴 전 소유권 이전 필요\n'
                    '· 다른 사람 서가에 참여 중이던 멤버십\n'
                    '· 프로필·계정(로그인) 정보',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 12),
                  Material(
                    color: Theme.of(context)
                        .colorScheme
                        .tertiaryContainer
                        .withValues(alpha: 0.65),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.all(10),
                      child: Text(
                        '소유한 공동서가에 다른 멤버가 있으면 탈퇴할 수 없습니다. '
                        '해당 서가 화면에서 소유권을 다른 멤버에게 이전한 뒤 탈퇴해 주세요. '
                        '본인만 남은 공동서가는 별도 삭제 없이 탈퇴 시 함께 정리됩니다.',
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
        if (prof != null) {
          _genderChoice = prof.gender;
          _birthDateIso = prof.birthDate;
          _genderPublic = prof.genderPublic;
          _birthDatePublic = prof.birthDatePublic;
          _annualGoalCtrl.text =
              prof.annualReadingGoal != null && prof.annualReadingGoal! >= 1
                  ? '${prof.annualReadingGoal}'
                  : '';
        }
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

  Future<void> _pickBirthDate(BuildContext context) async {
    final initial = _birthDateIso != null && _birthDateIso!.length >= 10
        ? DateTime.tryParse(_birthDateIso!.substring(0, 10))
        : DateTime(1990, 1, 1);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial ?? DateTime(1990, 1, 1),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null && mounted) {
      final y = picked.year.toString().padLeft(4, '0');
      final m = picked.month.toString().padLeft(2, '0');
      final d = picked.day.toString().padLeft(2, '0');
      setState(() => _birthDateIso = '$y-$m-$d');
    }
  }

  Future<void> _saveDemographics(BuildContext context) async {
    final goalRaw = _annualGoalCtrl.text.trim();
    int? annualGoal;
    if (goalRaw.isEmpty) {
      annualGoal = null;
    } else {
      final n = int.tryParse(goalRaw);
      if (n == null || n < 1 || n > 500) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('연간 목표는 1~500 권이거나 비워야 합니다.')),
        );
        return;
      }
      annualGoal = n;
    }
    setState(() {
      _demographicsSaving = true;
      _demographicsError = null;
    });
    try {
      final api = context.read<LibraryController>().api;
      final p = await api.updateMeProfile({
        'gender': _genderChoice,
        'birthDate': _birthDateIso,
        'genderPublic': _genderPublic,
        'birthDatePublic': _birthDatePublic,
        'annualReadingGoal': annualGoal,
      });
      if (!mounted) return;
      setState(() {
        _meProfile = p;
        _demographicsSaving = false;
      });
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('프로필을 저장했습니다.')));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _demographicsError = e.toString();
        _demographicsSaving = false;
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
        title: const Text('프로필 편집'),
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
          Text('화면 설정',
              style:
                  textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(
            '화면 모드',
            style: textTheme.labelLarge
                ?.copyWith(color: colorScheme.onSurfaceVariant),
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
          const SizedBox(height: 28),
          if (!loggedIn)
            Text(
              '로그인 후 이용할 수 있습니다.',
              style: TextStyle(color: colorScheme.error),
            )
          else ...[
            if (_meProfile != null) ...[
              Text('통계·프로필(선택)',
                  style: textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(
                '아래 정보는 저장만 되며, 「통계에 포함」을 켠 항목만 서버 집계에 활용될 수 있습니다.',
                style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant, height: 1.35),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                key: ValueKey(_genderChoice),
                initialValue: _normalizedGenderChoice,
                decoration: const InputDecoration(
                  labelText: '성별',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: null, child: Text('선택 안 함')),
                  DropdownMenuItem(value: 'male', child: Text('남성')),
                  DropdownMenuItem(value: 'female', child: Text('여성')),
                  DropdownMenuItem(value: 'other', child: Text('기타')),
                  DropdownMenuItem(value: 'unknown', child: Text('비공개')),
                ],
                onChanged: (v) => setState(() => _genderChoice = v),
              ),
              if (_genderChoice != null &&
                  _genderChoice!.isNotEmpty &&
                  _normalizedGenderChoice == null)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    '저장된 성별 값이 목록에 없어 「선택 안 함」으로 표시 중입니다. 저장 시 현재 목록 값으로 덮어씁니다.',
                    style: textTheme.labelSmall
                        ?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('생년월일'),
                subtitle: Text(_birthDateIso ?? '선택 안 함'),
                trailing: IconButton(
                  icon: const Icon(Icons.calendar_today_outlined),
                  onPressed: () => _pickBirthDate(context),
                ),
              ),
              if (_birthDateIso != null)
                TextButton(
                  onPressed: () => setState(() => _birthDateIso = null),
                  child: const Text('생년월일 지우기'),
                ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('성별을 통계에 포함'),
                value: _genderPublic,
                onChanged: (v) => setState(() => _genderPublic = v),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('생년(출생연도)을 통계에 포함'),
                value: _birthDatePublic,
                onChanged: (v) => setState(() => _birthDatePublic = v),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _annualGoalCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: '올해 완독 목표 (권)',
                  hintText: '비우면 목표 없음',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '홈·통계에서 올해 완독 수와 함께 표시됩니다. 1~500 권.',
                style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant, height: 1.35),
              ),
              if (_demographicsError != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(_demographicsError!,
                      style: TextStyle(color: colorScheme.error, fontSize: 13)),
                ),
              FilledButton.tonal(
                onPressed: _demographicsSaving
                    ? null
                    : () => _saveDemographics(context),
                child: Text(_demographicsSaving ? '저장 중…' : '프로필·목표 저장'),
              ),
              const SizedBox(height: 28),
            ],
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
                  leading:
                      Icon(Icons.stars_outlined, color: colorScheme.primary),
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
            Text(
              '계정을 삭제하면 데이터가 모두 사라집니다.',
              style: textTheme.bodySmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant),
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
