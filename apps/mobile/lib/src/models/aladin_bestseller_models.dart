/// 알라딘 목록 API(`GET /api/me/aladin-bestseller`) 응답 모델.
///
/// History:
/// - 2026-03-25: 웹과 동일 JSON 스키마 매핑
class AladinBestsellerItem {
  AladinBestsellerItem({
    required this.itemId,
    required this.title,
    required this.author,
    required this.link,
    required this.isbn,
    required this.isbn13,
    required this.pubDate,
    required this.cover,
    required this.publisher,
    required this.priceSales,
    required this.priceStandard,
    required this.categoryName,
    required this.salesPoint,
  });

  final String itemId;
  final String title;
  final String author;
  final String link;
  final String isbn;
  final String isbn13;
  final String pubDate;
  final String cover;
  final String publisher;
  final int? priceSales;
  final int? priceStandard;
  final String categoryName;
  final int? salesPoint;

  factory AladinBestsellerItem.fromJson(Map<String, dynamic> json) {
    int? asInt(dynamic v) {
      if (v == null) return null;
      if (v is int) return v;
      if (v is num) return v.toInt();
      final s = v.toString().trim();
      if (s.isEmpty) return null;
      return int.tryParse(s);
    }

    return AladinBestsellerItem(
      itemId: json['itemId']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      author: json['author']?.toString() ?? '',
      link: json['link']?.toString() ?? '',
      isbn: json['isbn']?.toString() ?? '',
      isbn13: json['isbn13']?.toString() ?? '',
      pubDate: json['pubDate']?.toString() ?? '',
      cover: json['cover']?.toString() ?? '',
      publisher: json['publisher']?.toString() ?? '',
      priceSales: asInt(json['priceSales']),
      priceStandard: asInt(json['priceStandard']),
      categoryName: json['categoryName']?.toString() ?? '',
      salesPoint: asInt(json['salesPoint']),
    );
  }
}

class AladinBestsellerFeed {
  AladinBestsellerFeed({
    required this.feedTitle,
    required this.feedLink,
    required this.query,
    required this.items,
  });

  final String feedTitle;
  final String feedLink;
  final String query;
  final List<AladinBestsellerItem> items;

  factory AladinBestsellerFeed.fromJson(Map<String, dynamic> json) {
    final raw = json['items'];
    final list = raw is List<dynamic>
        ? raw
            .map((e) => AladinBestsellerItem.fromJson(e as Map<String, dynamic>))
            .toList()
        : <AladinBestsellerItem>[];
    return AladinBestsellerFeed(
      feedTitle: json['feedTitle']?.toString() ?? '',
      feedLink: json['feedLink']?.toString() ?? '',
      query: json['query']?.toString() ?? '',
      items: list,
    );
  }
}
