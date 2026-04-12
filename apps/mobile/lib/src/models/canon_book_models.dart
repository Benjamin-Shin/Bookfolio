/// `GET /api/me/canon-books/:bookId/purchase-offers` 응답.
///
/// @history
/// - 2026-04-08: 비소장 상세 구매 행
class CanonBookPurchaseOffers {
  const CanonBookPurchaseOffers({
    required this.bookId,
    required this.isbn,
    required this.title,
    required this.authors,
    required this.aladinUrl,
    required this.aladinPriceKrw,
    required this.naverUrl,
    required this.naverPriceKrw,
    required this.kyoboUrl,
    required this.cached,
    required this.fetchedAt,
    required this.expiresAt,
  });

  final String bookId;
  final String? isbn;
  final String title;
  final List<String> authors;
  final String aladinUrl;
  final int? aladinPriceKrw;
  final String? naverUrl;
  final int? naverPriceKrw;
  final String kyoboUrl;
  final bool cached;
  final String fetchedAt;
  final String expiresAt;

  factory CanonBookPurchaseOffers.fromJson(Map<String, dynamic> json) {
    int? asInt(dynamic v) {
      if (v == null) return null;
      if (v is int) return v;
      if (v is num) return v.toInt();
      return int.tryParse(v.toString());
    }

    final aladin = json['aladin'] as Map<String, dynamic>? ?? {};
    final naver = json['naver'] as Map<String, dynamic>? ?? {};
    final kyobo = json['kyobo'] as Map<String, dynamic>? ?? {};

    return CanonBookPurchaseOffers(
      bookId: json['bookId']?.toString() ?? '',
      isbn: json['isbn']?.toString(),
      title: json['title']?.toString() ?? '',
      authors: (json['authors'] as List<dynamic>? ?? []).map((e) => e.toString()).toList(),
      aladinUrl: aladin['url']?.toString() ?? '',
      aladinPriceKrw: asInt(aladin['priceKrw']),
      naverUrl: naver['url']?.toString(),
      naverPriceKrw: asInt(naver['priceKrw']),
      kyoboUrl: kyobo['url']?.toString() ?? '',
      cached: json['cached'] == true,
      fetchedAt: json['fetchedAt']?.toString() ?? '',
      expiresAt: json['expiresAt']?.toString() ?? '',
    );
  }
}

/// `GET /api/me/canon-books/:bookId/community-one-liners` 행.
///
/// @history
/// - 2026-04-08: 비소장 상세 한줄평
class CanonCommunityOneLiner {
  const CanonCommunityOneLiner({
    required this.userId,
    required this.displayName,
    required this.body,
    required this.updatedAt,
  });

  final String userId;
  final String? displayName;
  final String body;
  final String updatedAt;

  factory CanonCommunityOneLiner.fromJson(Map<String, dynamic> json) {
    return CanonCommunityOneLiner(
      userId: json['userId']?.toString() ?? '',
      displayName: json['displayName']?.toString(),
      body: json['body']?.toString() ?? '',
      updatedAt: json['updatedAt']?.toString() ?? '',
    );
  }
}
