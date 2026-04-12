/// 발견 탭 `GET /api/me/discover/community-books` 행.
///
/// History:
/// - 2026-04-05: 타인 소장·본인 미소장 캐논 목록용 모델
class DiscoverCommunityBook {
  const DiscoverCommunityBook({
    required this.bookId,
    required this.isbn,
    required this.title,
    required this.authors,
    this.coverUrl,
    this.publisher,
    this.publishedDate,
    this.description,
    this.priceKrw,
    required this.format,
    required this.otherOwnerCount,
    required this.lastAddedAt,
  });

  final String bookId;
  final String? isbn;
  final String title;
  final List<String> authors;
  final String? coverUrl;
  final String? publisher;
  final String? publishedDate;
  final String? description;
  final int? priceKrw;
  final String format;
  final int otherOwnerCount;
  final String lastAddedAt;

  factory DiscoverCommunityBook.fromJson(Map<String, dynamic> json) {
    int? asInt(dynamic v) {
      if (v == null) return null;
      if (v is int) return v;
      if (v is num) return v.toInt();
      return int.tryParse(v.toString());
    }

    return DiscoverCommunityBook(
      bookId: json['bookId']?.toString() ?? '',
      isbn: json['isbn']?.toString(),
      title: json['title']?.toString() ?? '',
      authors: (json['authors'] as List<dynamic>? ?? []).map((e) => e.toString()).toList(),
      coverUrl: json['coverUrl']?.toString(),
      publisher: json['publisher']?.toString(),
      publishedDate: json['publishedDate']?.toString(),
      description: json['description']?.toString(),
      priceKrw: asInt(json['priceKrw']),
      format: json['format']?.toString() ?? 'paper',
      otherOwnerCount: asInt(json['otherOwnerCount']) ?? 0,
      lastAddedAt: json['lastAddedAt']?.toString() ?? '',
    );
  }
}
