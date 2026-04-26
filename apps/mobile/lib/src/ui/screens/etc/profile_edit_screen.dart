import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/models/aladin_bestseller_models.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 프로필 편집: 화면 설정·인구통계·포인트·회원 탈퇴.
///
/// History:
/// - 2026-04-27: 화면 설정(테마 모드) 제거, 관심 카테고리 추가를 depth1/depth2/depth3 드롭다운 선택으로 변경
/// - 2026-04-26: 알라딘 국내도서 관심 카테고리(최대 5개) 선택/저장
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
  List<AladinCategoryOption> _domesticCategories = const [];
  List<int> _favoriteCategoryIds = const [];

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
                    '· 내가 만든 모임서가 — 다른 멤버가 없으면 탈퇴와 함께 삭제되고, 있으면 탈퇴 전 소유권 이전 필요\n'
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
                        '소유한 모임서가에 다른 멤버가 있으면 탈퇴할 수 없습니다. '
                        '해당 서가 화면에서 소유권을 다른 멤버에게 이전한 뒤 탈퇴해 주세요. '
                        '본인만 남은 모임서가는 별도 삭제 없이 탈퇴 시 함께 정리됩니다.',
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
      List<AladinCategoryOption> categories = const [];
      try {
        prof = await api.fetchMeProfile();
      } catch (_) {
        prof = null;
      }
      try {
        final all = await api.fetchAladinCategories();
        categories =
            all.where((c) => c.mall == '국내도서' && c.categoryId > 0).toList();
      } catch (_) {
        categories = const [];
      }
      if (!mounted) return;
      setState(() {
        _points = bal;
        _meProfile = prof;
        _domesticCategories = categories;
        if (prof != null) {
          _genderChoice = prof.gender;
          _birthDateIso = prof.birthDate;
          _genderPublic = prof.genderPublic;
          _birthDatePublic = prof.birthDatePublic;
          _annualGoalCtrl.text =
              prof.annualReadingGoal != null && prof.annualReadingGoal! >= 1
                  ? '${prof.annualReadingGoal}'
                  : '';
          _favoriteCategoryIds = prof.favoriteAladinCategoryIds
              .where((cid) =>
                  cid > 0 && categories.any((item) => item.categoryId == cid))
              .take(5)
              .toList();
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

  String _categoryLabelById(int categoryId) {
    final option = _domesticCategories.cast<AladinCategoryOption?>().firstWhere(
          (item) => item?.categoryId == categoryId,
          orElse: () => null,
        );
    if (option == null) return 'CID $categoryId';
    return option.label.isNotEmpty ? option.label : 'CID $categoryId';
  }

  Future<void> _addFavoriteCategory(BuildContext context) async {
    if (_favoriteCategoryIds.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('관심 카테고리는 최대 5개까지 선택할 수 있습니다.')),
      );
      return;
    }
    if (_domesticCategories.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('카테고리 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')),
      );
      return;
    }
    final selected = await showModalBottomSheet<AladinCategoryOption?>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _CategoryDepthSelectorSheet(
        categories: _domesticCategories,
        selectedIds: _favoriteCategoryIds.toSet(),
      ),
    );
    if (!mounted || selected == null) return;
    if (_favoriteCategoryIds.contains(selected.categoryId)) return;
    setState(() {
      _favoriteCategoryIds = [..._favoriteCategoryIds, selected.categoryId];
    });
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
        'favoriteAladinCategoryIds': _favoriteCategoryIds,
      });
      if (!mounted) return;
      setState(() {
        _meProfile = p;
        _favoriteCategoryIds = p.favoriteAladinCategoryIds
            .where((cid) =>
                cid > 0 &&
                _domesticCategories.any((item) => item.categoryId == cid))
            .take(5)
            .toList();
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

  Widget _buildSectionCard({
    required BuildContext context,
    required Widget child,
    EdgeInsetsGeometry padding = const EdgeInsets.all(16),
  }) {
    return Container(
      decoration: BoxDecoration(
        color: BookfolioDesignTokens.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: BookfolioDesignTokens.ghostOutline(0.2)),
        boxShadow: BookfolioDesignTokens.ambientShadowPrimary(),
      ),
      child: Padding(
        padding: padding,
        child: child,
      ),
    );
  }

  Widget _buildSectionTitle(
    BuildContext context, {
    required String title,
    String? subtitle,
  }) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
              height: 1.4,
            ),
          ),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
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
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
        children: [
          if (!loggedIn)
            _buildSectionCard(
              context: context,
              child: Row(
                children: [
                  Icon(Icons.lock_outline, color: colorScheme.error),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '로그인 후 프로필 편집과 통계를 이용할 수 있습니다.',
                      style: textTheme.bodyMedium
                          ?.copyWith(color: colorScheme.onSurface),
                    ),
                  ),
                ],
              ),
            )
          else ...[
            if (_meProfile != null) ...[
              _buildSectionCard(
                context: context,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionTitle(
                      context,
                      title: '통계 · 프로필',
                      subtitle:
                          '저장된 정보 중 "통계에 포함"을 켠 항목만 집계 데이터에 반영될 수 있습니다.',
                    ),
                    const SizedBox(height: 14),
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
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          '저장된 성별 값이 목록에 없어 "선택 안 함"으로 표시 중입니다. 저장 시 현재 목록 값으로 덮어씁니다.',
                          style: textTheme.labelSmall
                              ?.copyWith(color: colorScheme.onSurfaceVariant),
                        ),
                      ),
                    const SizedBox(height: 12),
                    ListTile(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                        side: BorderSide(
                          color: BookfolioDesignTokens.ghostOutline(0.2),
                        ),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 2,
                      ),
                      title: const Text('생년월일'),
                      subtitle: Text(_birthDateIso ?? '선택 안 함'),
                      trailing: IconButton(
                        icon: const Icon(Icons.calendar_today_outlined),
                        onPressed: () => _pickBirthDate(context),
                      ),
                    ),
                    if (_birthDateIso != null)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton(
                          onPressed: () => setState(() => _birthDateIso = null),
                          child: const Text('생년월일 지우기'),
                        ),
                      ),
                    const Divider(height: 22),
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
                    const SizedBox(height: 12),
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
                        color: colorScheme.onSurfaceVariant,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '관심 카테고리 (국내도서, 최대 5개)',
                            style: textTheme.titleSmall
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ),
                        TextButton.icon(
                          onPressed: _demographicsSaving
                              ? null
                              : () => _addFavoriteCategory(context),
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('추가'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_favoriteCategoryIds.isEmpty)
                      Text(
                        '선택된 카테고리가 없습니다. 발견 탭의 베스트셀러/초이스 신간은 이 목록 기준으로 노출됩니다.',
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                          height: 1.35,
                        ),
                      )
                    else
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final categoryId in _favoriteCategoryIds)
                            InputChip(
                              label: Text(_categoryLabelById(categoryId)),
                              onDeleted: _demographicsSaving
                                  ? null
                                  : () => setState(() {
                                        _favoriteCategoryIds =
                                            _favoriteCategoryIds
                                                .where((id) => id != categoryId)
                                                .toList();
                                      }),
                            ),
                        ],
                      ),
                    if (_demographicsError != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          _demographicsError!,
                          style: TextStyle(color: colorScheme.error, fontSize: 13),
                        ),
                      ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.tonal(
                        onPressed: _demographicsSaving
                            ? null
                            : () => _saveDemographics(context),
                        child:
                            Text(_demographicsSaving ? '저장 중…' : '프로필·목표 저장'),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
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
            else if (_points != null)
              _buildSectionCard(
                context: context,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: Column(
                  children: [
                    ListTile(
                      leading:
                          Icon(Icons.stars_outlined, color: colorScheme.primary),
                      title: const Text('포인트'),
                      subtitle: Text(
                        '${_points!.balance} P',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                    ),
                    const Divider(height: 4),
                    ListTile(
                      leading: Icon(
                        _points!.vipActive
                            ? Icons.workspace_premium
                            : Icons.workspace_premium_outlined,
                        color: colorScheme.primary,
                      ),
                      title: const Text('VIP'),
                      subtitle: Text(_points!.vipActive ? '활성' : '비활성'),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 18),
            _buildSectionCard(
              context: context,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '계정 관리',
                    style:
                        textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '계정을 삭제하면 포인트와 개인 데이터가 모두 제거되며 복구할 수 없습니다.',
                    style: textTheme.bodySmall
                        ?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 8),
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
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CategoryDepthSelectorSheet extends StatefulWidget {
  const _CategoryDepthSelectorSheet({
    required List<AladinCategoryOption> categories,
    required Set<int> selectedIds,
  })  : _categories = categories,
        _selectedIds = selectedIds;

  final List<AladinCategoryOption> _categories;
  final Set<int> _selectedIds;

  @override
  State<_CategoryDepthSelectorSheet> createState() =>
      _CategoryDepthSelectorSheetState();
}

class _CategoryDepthSelectorSheetState extends State<_CategoryDepthSelectorSheet> {
  String? _selectedDepth1;
  String? _selectedDepth2;
  String? _selectedDepth3;

  List<AladinCategoryOption> get _available =>
      widget._categories.where((c) => !widget._selectedIds.contains(c.categoryId)).toList();

  List<String> get _depth1Options => _available
      .map((c) => c.depth1.trim())
      .where((v) => v.isNotEmpty)
      .toSet()
      .toList()
    ..sort();

  List<String> get _depth2Options => _available
      .where((c) => c.depth1.trim() == _selectedDepth1)
      .map((c) => c.depth2.trim())
      .where((v) => v.isNotEmpty)
      .toSet()
      .toList()
    ..sort();

  List<String> get _depth3Options => _available
      .where((c) =>
          c.depth1.trim() == _selectedDepth1 &&
          c.depth2.trim() == _selectedDepth2)
      .map((c) => c.depth3.trim())
      .where((v) => v.isNotEmpty)
      .toSet()
      .toList()
    ..sort();

  AladinCategoryOption? get _selectedCategory {
    final d1 = _selectedDepth1;
    final d2 = _selectedDepth2;
    final d3 = _selectedDepth3;
    if (d1 == null) {
      return null;
    }

    AladinCategoryOption? pick(bool Function(AladinCategoryOption c) test) {
      for (final c in _available) {
        if (test(c)) return c;
      }
      return null;
    }

    if (d2 != null && d3 != null) {
      return pick((c) =>
          c.depth1.trim() == d1 &&
          c.depth2.trim() == d2 &&
          c.depth3.trim() == d3);
    }

    if (d2 != null) {
      // 중분류 단계 CID가 있으면 우선 사용(보통 depth3가 비어있음).
      final mid = pick((c) =>
          c.depth1.trim() == d1 &&
          c.depth2.trim() == d2 &&
          c.depth3.trim().isEmpty);
      if (mid != null) return mid;
      // 데이터가 한 건만 있으면 해당 CID를 중분류 대표로 사용.
      final matches = _available
          .where((c) => c.depth1.trim() == d1 && c.depth2.trim() == d2)
          .toList();
      if (matches.length == 1) return matches.first;
      return null;
    }

    // 대분류 단계 CID가 있으면 사용(보통 depth2/depth3 비어있음).
    final top = pick((c) =>
        c.depth1.trim() == d1 &&
        c.depth2.trim().isEmpty &&
        c.depth3.trim().isEmpty);
    if (top != null) return top;
    final matches =
        _available.where((c) => c.depth1.trim() == d1).toList();
    if (matches.length == 1) return matches.first;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final depth1 = _depth1Options;
    final depth2 = _depth2Options;
    final depth3 = _depth3Options;
    final selected = _selectedCategory;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, 14, 16, 16 + bottomInset),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              '관심 카테고리 추가',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Text(
              '대분류 > 중분류 > 소분류 순서로 선택하세요.',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              initialValue: _selectedDepth1,
              decoration: const InputDecoration(
                labelText: '대분류',
                border: OutlineInputBorder(),
              ),
              items: [
                for (final v in depth1)
                  DropdownMenuItem<String>(value: v, child: Text(v)),
              ],
              onChanged: (v) {
                setState(() {
                  _selectedDepth1 = v;
                  _selectedDepth2 = null;
                  _selectedDepth3 = null;
                });
              },
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String?>(
              initialValue: _selectedDepth2,
              decoration: const InputDecoration(
                labelText: '중분류',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem<String>(
                  value: null,
                  child: Text('선택 안 함'),
                ),
                for (final v in depth2)
                  DropdownMenuItem<String?>(value: v, child: Text(v)),
              ],
              onChanged: _selectedDepth1 == null
                  ? null
                  : (v) {
                      setState(() {
                        _selectedDepth2 = v;
                        _selectedDepth3 = null;
                      });
                    },
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String?>(
              initialValue: _selectedDepth3,
              decoration: const InputDecoration(
                labelText: '소분류',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem<String>(
                  value: null,
                  child: Text('선택 안 함'),
                ),
                for (final v in depth3)
                  DropdownMenuItem<String?>(value: v, child: Text(v)),
              ],
              onChanged: _selectedDepth2 == null
                  ? null
                  : (v) => setState(() => _selectedDepth3 = v),
            ),
            if (selected != null) ...[
              const SizedBox(height: 10),
              Text(
                '선택 CID: ${selected.categoryId}',
                style: Theme.of(context).textTheme.labelMedium,
              ),
            ],
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('취소'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton(
                    onPressed: selected == null
                        ? null
                        : () => Navigator.of(context).pop(selected),
                    child: const Text('추가'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
