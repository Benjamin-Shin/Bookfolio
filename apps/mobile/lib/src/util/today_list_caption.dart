/// 오늘 날짜 기준 목록 안내 문구(베스트셀러 / 초이스 신간).
///
/// History:
/// - 2026-03-26: 신규
String todayBestsellerListCaption() {
  final d = DateTime.now();
  return '${d.year}년 ${d.month}월 ${d.day}일 기준 베스트셀러 목록입니다.';
}

String todayChoiceNewListCaption() {
  final d = DateTime.now();
  return '${d.year}년 ${d.month}월 ${d.day}일 기준 초이스 신간 목록입니다.';
}
