/// `user_books.tags` 정규화(웹 `@bookfolio/shared`와 동일 규칙).
///
/// History:
/// - 2026-05-24: 책당 최대 5개·20자
const int kUserBookTagMaxCount = 5;
const int kUserBookTagMaxLength = 20;

/// 목록 API·필터에서 「태그 없음」.
const String kUserBookTagUntaggedFilter = '__untagged__';

List<String> normalizeUserBookTags(Iterable<String> raw) {
  final seen = <String>{};
  final out = <String>[];
  for (var t in raw) {
    t = t.trim();
    if (t.isEmpty) continue;
    if (t.length > kUserBookTagMaxLength) {
      t = t.substring(0, kUserBookTagMaxLength);
    }
    final key = t.toLowerCase();
    if (seen.contains(key)) continue;
    seen.add(key);
    out.add(t);
    if (out.length >= kUserBookTagMaxCount) break;
  }
  return out;
}
