import 'package:seogadam_mobile/src/models/book_models.dart';

String bookFormatLabelKo(BookFormat f) {
  return switch (f) {
    BookFormat.paper => '종이책',
    BookFormat.ebook => '전자책',
    BookFormat.audiobook => '오디오북',
    BookFormat.unknown => '형식 미상',
  };
}

String readingStatusLabelKo(ReadingStatus s) {
  return switch (s) {
    ReadingStatus.unread => '읽기 전',
    ReadingStatus.reading => '읽는 중',
    ReadingStatus.completed => '완독',
    ReadingStatus.paused => '일시중지',
    ReadingStatus.dropped => '하차',
  };
}

/// API 문자열(`unread` 등)을 한글 라벨로. 알 수 없으면 원문 반환.
///
/// History:
/// - 2026-03-25: 공동서재 소유자 행용
String readingStatusLabelFromApi(String raw) {
  try {
    return readingStatusLabelKo(ReadingStatus.values.byName(raw));
  } catch (_) {
    return raw.isEmpty ? '—' : raw;
  }
}
