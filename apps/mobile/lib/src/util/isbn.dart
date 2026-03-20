/// 서버 `normalizeIsbn`과 동일하게 숫자(및 ISBN-10의 X)만 남깁니다.
String? normalizeIsbnInput(String raw) {
  final buf = StringBuffer();
  for (final c in raw.runes) {
    final ch = String.fromCharCode(c);
    if (RegExp(r'[0-9]', caseSensitive: false).hasMatch(ch)) {
      buf.write(ch);
    } else if (ch == 'X' || ch == 'x') {
      buf.write('X');
    }
  }
  final s = buf.toString();
  return s.isEmpty ? null : s;
}

bool isPlausibleIsbn(String normalized) =>
    normalized.length == 10 || normalized.length == 13;
