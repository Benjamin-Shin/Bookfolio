import 'package:bookfolio_mobile/src/models/book_models.dart';

String bookFormatLabelKo(BookFormat f) {
  return switch (f) {
    BookFormat.paper => '종이책',
    BookFormat.ebook => '전자책',
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
