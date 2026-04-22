import 'package:seogadam_mobile/src/models/aladin_bestseller_models.dart';

class AladinCategoryFilterState {
  const AladinCategoryFilterState({
    this.mall,
    this.depth1,
    this.depth2,
    this.depth3,
  });

  final String? mall;
  final String? depth1;
  final String? depth2;
  final String? depth3;

  AladinCategoryFilterState copyWith({
    String? mall,
    String? depth1,
    String? depth2,
    String? depth3,
  }) {
    return AladinCategoryFilterState(
      mall: mall,
      depth1: depth1,
      depth2: depth2,
      depth3: depth3,
    );
  }
}

class AladinCategoryFilterOptions {
  const AladinCategoryFilterOptions({
    required this.malls,
    required this.depth1,
    required this.depth2,
    required this.depth3,
    required this.categoryId,
  });

  final List<String> malls;
  final List<String> depth1;
  final List<String> depth2;
  final List<String> depth3;
  final int categoryId;
}

List<String> _uniqueNonEmpty(Iterable<String> values) {
  final out = <String>[];
  final seen = <String>{};
  for (final raw in values) {
    final v = raw.trim();
    if (v.isEmpty || seen.contains(v)) continue;
    seen.add(v);
    out.add(v);
  }
  return out;
}

int _pickCategoryId(List<AladinCategoryOption> all, AladinCategoryFilterState state) {
  final mall = state.mall?.trim() ?? '';
  final depth1 = state.depth1?.trim() ?? '';
  final depth2 = state.depth2?.trim() ?? '';
  final depth3 = state.depth3?.trim() ?? '';
  if (mall.isEmpty) return 0;

  final byMall = all.where((c) => c.mall == mall).toList();
  if (byMall.isEmpty) return 0;
  if (depth1.isEmpty) {
    return byMall.firstWhere(
      (c) => c.depth1.trim().isEmpty,
      orElse: () => byMall.first,
    ).categoryId;
  }

  final byDepth1 = byMall.where((c) => c.depth1 == depth1).toList();
  if (byDepth1.isEmpty) return byMall.first.categoryId;
  if (depth2.isEmpty) {
    return byDepth1.firstWhere(
      (c) => c.depth2.trim().isEmpty,
      orElse: () => byDepth1.first,
    ).categoryId;
  }

  final byDepth2 = byDepth1.where((c) => c.depth2 == depth2).toList();
  if (byDepth2.isEmpty) return byDepth1.first.categoryId;
  if (depth3.isEmpty) {
    return byDepth2.firstWhere(
      (c) => c.depth3.trim().isEmpty,
      orElse: () => byDepth2.first,
    ).categoryId;
  }

  return byDepth2.firstWhere(
    (c) => c.depth3 == depth3,
    orElse: () => byDepth2.first,
  ).categoryId;
}

AladinCategoryFilterOptions buildAladinCategoryFilterOptions(
  List<AladinCategoryOption> all,
  AladinCategoryFilterState state,
) {
  final categories = all.where((c) => c.categoryId != 0).toList();
  final malls = _uniqueNonEmpty(categories.map((c) => c.mall));
  final mall = state.mall?.trim() ?? '';
  final byMall = mall.isEmpty ? const <AladinCategoryOption>[] : categories.where((c) => c.mall == mall).toList();

  final depth1 = _uniqueNonEmpty(byMall.map((c) => c.depth1));
  final selectedDepth1 = state.depth1?.trim() ?? '';
  final byDepth1 = selectedDepth1.isEmpty
      ? const <AladinCategoryOption>[]
      : byMall.where((c) => c.depth1 == selectedDepth1).toList();

  final depth2 = _uniqueNonEmpty(byDepth1.map((c) => c.depth2));
  final selectedDepth2 = state.depth2?.trim() ?? '';
  final byDepth2 = selectedDepth2.isEmpty
      ? const <AladinCategoryOption>[]
      : byDepth1.where((c) => c.depth2 == selectedDepth2).toList();

  final depth3 = _uniqueNonEmpty(byDepth2.map((c) => c.depth3));
  final categoryId = _pickCategoryId(categories, state);

  return AladinCategoryFilterOptions(
    malls: malls,
    depth1: depth1,
    depth2: depth2,
    depth3: depth3,
    categoryId: categoryId,
  );
}

