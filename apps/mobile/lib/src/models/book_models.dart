/// 서버 `books.format` / API `format`와 동일한 이름.
///
/// History:
/// - 2026-03-26: `audiobook`, `unknown` 추가(마이그레이션 0021)
enum BookFormat { paper, ebook, audiobook, unknown }

BookFormat bookFormatFromApi(String? raw) {
  if (raw == null || raw.isEmpty) return BookFormat.unknown;
  for (final v in BookFormat.values) {
    if (v.name == raw) return v;
  }
  return BookFormat.unknown;
}

enum ReadingStatus { unread, reading, completed, paused, dropped }

class BookLookupResult {
  const BookLookupResult({
    required this.isbn,
    required this.title,
    required this.authors,
    required this.publisher,
    required this.publishedDate,
    required this.coverUrl,
    required this.description,
    this.priceKrw,
    required this.source,
    this.genreSlugs = const [],
    this.literatureRegion,
    this.originalLanguage,
  });

  final String isbn;
  final String title;
  final List<String> authors;
  final String? publisher;
  final String? publishedDate;
  final String? coverUrl;
  final String? description;
  final int? priceKrw;
  final String source;
  final List<String> genreSlugs;
  final String? literatureRegion;
  final String? originalLanguage;

  factory BookLookupResult.fromJson(Map<String, dynamic> json) {
    return BookLookupResult(
      isbn: json['isbn'] as String,
      title: json['title'] as String,
      authors: (json['authors'] as List<dynamic>? ?? []).cast<String>(),
      publisher: json['publisher'] as String?,
      publishedDate: json['publishedDate'] as String?,
      coverUrl: json['coverUrl'] as String?,
      description: json['description'] as String?,
      priceKrw: (json['priceKrw'] as num?)?.toInt(),
      source: json['source'] as String,
      genreSlugs: (json['genreSlugs'] as List<dynamic>? ?? []).map((e) => e.toString()).toList(),
      literatureRegion: json['literatureRegion'] as String?,
      originalLanguage: json['originalLanguage'] as String?,
    );
  }
}

/// 서버 `UserBookMemoRow`에 대응.
///
/// History:
/// - 2026-03-26: `user_books.memo` 제거 후 신규
class UserBookMemo {
  const UserBookMemo({
    required this.id,
    required this.userBookId,
    required this.bodyMd,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String userBookId;
  final String bodyMd;
  final String createdAt;
  final String updatedAt;

  factory UserBookMemo.fromJson(Map<String, dynamic> json) {
    return UserBookMemo(
      id: json['id'] as String,
      userBookId: json['userBookId'] as String,
      bodyMd: json['bodyMd'] as String,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}

class BookOneLinerItem {
  const BookOneLinerItem({
    required this.userId,
    this.displayName,
    required this.body,
    required this.updatedAt,
  });

  final String userId;
  final String? displayName;
  final String body;
  final String updatedAt;

  factory BookOneLinerItem.fromJson(Map<String, dynamic> json) {
    return BookOneLinerItem(
      userId: json['userId'] as String,
      displayName: json['displayName'] as String?,
      body: json['body'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}

class ReadingEventItem {
  const ReadingEventItem({
    required this.id,
    required this.userBookId,
    required this.eventType,
    required this.payload,
    required this.occurredAt,
  });

  final String id;
  final String userBookId;
  final String eventType;
  final Map<String, dynamic> payload;
  final String occurredAt;

  factory ReadingEventItem.fromJson(Map<String, dynamic> json) {
    final raw = json['payload'];
    return ReadingEventItem(
      id: json['id'] as String,
      userBookId: json['userBookId'] as String,
      eventType: json['eventType'] as String,
      payload: raw is Map<String, dynamic> ? raw : <String, dynamic>{},
      occurredAt: json['occurredAt'] as String,
    );
  }
}

class UserBook {
  const UserBook({
    required this.id,
    required this.bookId,
    required this.title,
    required this.authors,
    required this.format,
    required this.readingStatus,
    required this.rating,
    required this.coverUrl,
    required this.publisher,
    required this.publishedDate,
    required this.description,
    required this.isbn,
    required this.isOwned,
    this.priceKrw,
    this.location,
  });

  final String id;
  final String bookId;
  final String title;
  final List<String> authors;
  final BookFormat format;
  final ReadingStatus readingStatus;
  final int? rating;
  final String? coverUrl;
  final String? publisher;
  final String? publishedDate;
  final String? description;
  final String? isbn;
  final bool isOwned;
  final int? priceKrw;
  final String? location;

  /// History:
  /// - 2026-03-26: `book_id`·`bookId` 병행 파싱(서버/캐시 대비), 빈 값 시 한줄평 URL 404 방지
  factory UserBook.fromJson(Map<String, dynamic> json) {
    return UserBook(
      id: json['id'] as String,
      bookId: json['bookId'] as String? ?? json['book_id'] as String? ?? '',
      title: json['title'] as String,
      authors: (json['authors'] as List<dynamic>? ?? []).cast<String>(),
      format: bookFormatFromApi(json['format'] as String?),
      readingStatus: ReadingStatus.values.byName(json['readingStatus'] as String),
      rating: json['rating'] as int?,
      coverUrl: json['coverUrl'] as String?,
      publisher: json['publisher'] as String?,
      publishedDate: json['publishedDate'] as String?,
      description: json['description'] as String?,
      isbn: json['isbn'] as String?,
      isOwned: json['isOwned'] as bool? ?? true,
      priceKrw: (json['priceKrw'] as num?)?.toInt(),
      location: json['location'] as String?,
    );
  }

  Map<String, dynamic> toCreatePayload() {
    return {
      'isbn': isbn,
      'title': title,
      'authors': authors,
      'format': format.name,
      'readingStatus': readingStatus.name,
      'rating': rating,
      'coverUrl': coverUrl,
      'publisher': publisher,
      'publishedDate': publishedDate,
      'description': description,
      'priceKrw': priceKrw,
      'isOwned': isOwned,
      'location': location,
    };
  }
}
