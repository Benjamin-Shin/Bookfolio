import 'package:seogadam_mobile/src/models/aladin_bestseller_models.dart';

/// [categoryId]에 맞는 [AladinCategoryOption]을 찾고, 없으면 분야 탐색용 플레이스홀더를 만든다.
///
/// History:
/// - 2026-05-24: 발견·베스트·신간 공통 util로 분리
/// - 2026-05-12: 동일 CID가 CSV에 여러 행일 때 가장 깊은 depth·긴 `label` 우선
/// - 2026-05-03: 국내도서 몰 우선, 없으면 동일 CID 임의 몰, 없으면 synthetic
AladinCategoryOption resolveAladinCategoryForDiscovery(
  int categoryId,
  List<AladinCategoryOption> all,
) {
  int depthScore(AladinCategoryOption o) {
    var s = 0;
    if (o.depth1.isNotEmpty) s += 1;
    if (o.depth2.isNotEmpty) s += 2;
    if (o.depth3.isNotEmpty) s += 4;
    return s;
  }

  final domestic =
      all.where((c) => c.categoryId == categoryId && c.mall == '국내도서').toList();
  if (domestic.length > 1) {
    domestic.sort((a, b) {
      final byDepth = depthScore(b).compareTo(depthScore(a));
      if (byDepth != 0) return byDepth;
      return b.label.length.compareTo(a.label.length);
    });
    return domestic.first;
  }
  if (domestic.isNotEmpty) return domestic.single;

  for (final c in all) {
    if (c.categoryId == categoryId) return c;
  }

  return AladinCategoryOption(
    categoryId: categoryId,
    mall: '국내도서',
    depth1: '',
    depth2: '',
    depth3: '',
    label: '',
  );
}

/// 사용자-facing 라벨에서 CID·내부 ID 표기를 제거한다.
String stripUserFacingCid(String text) {
  var t = text.trim();
  t = t.replaceAll(RegExp(r'\s*\(CID\s*\d+\)\s*', caseSensitive: false), '');
  t = t.replaceAll(RegExp(r'\s*CID\s*\d+\s*$', caseSensitive: false), '');
  t = t.replaceAll(RegExp(r'^분야\s*#\d+$'), '분야');
  return t.trim();
}

/// 알라딘 카테고리를 사용자에게 보여 줄 장르 이름으로 변환한다.
///
/// History:
/// - 2026-05-24: CID·내부 ID 숨김, 경로 라벨은 마지막 구간만
String displayLabelForAladinCategory(AladinCategoryOption c) {
  String? raw;
  if (c.depth3.isNotEmpty) {
    raw = c.depth3;
  } else if (c.depth2.isNotEmpty) {
    raw = c.depth2;
  } else if (c.depth1.isNotEmpty) {
    raw = c.depth1;
  } else if (c.label.isNotEmpty) {
    final label = c.label.trim();
    raw = label.contains(' > ') ? label.split(' > ').last.trim() : label;
  }
  if (raw == null || raw.isEmpty) return '분야';
  final cleaned = stripUserFacingCid(raw);
  return cleaned.isNotEmpty ? cleaned : '분야';
}

/// 베스트셀러·초이스 신간 목록 상단 카테고리 안내 문구.
///
/// History:
/// - 2026-05-24: CID 제거, 관심 분야는 장르 이름으로 표시
String aladinDiscoveryFeedCategoryCaption({
  required bool usingProfileFavorites,
  required List<AladinCategoryOption> categories,
}) {
  if (usingProfileFavorites) {
    if (categories.isEmpty) {
      return '국내도서 관심 분야 기준';
    }
    final names = categories.map(displayLabelForAladinCategory).toList();
    if (names.length == 1) {
      return '국내도서 관심 분야: ${names.single} 기준';
    }
    if (names.length == 2) {
      return '국내도서 관심 분야: ${names.join(' · ')} 기준';
    }
    return '국내도서 관심 분야: ${names[0]} · ${names[1]} 외 ${names.length - 2} 기준';
  }
  final name = categories.isNotEmpty
      ? displayLabelForAladinCategory(categories.first)
      : '소설';
  return '국내도서 기본 카테고리: $name 기준';
}
