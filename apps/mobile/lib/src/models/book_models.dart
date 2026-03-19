enum BookFormat { paper, ebook }

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
    required this.source,
  });

  final String isbn;
  final String title;
  final List<String> authors;
  final String? publisher;
  final String? publishedDate;
  final String? coverUrl;
  final String? description;
  final String source;

  factory BookLookupResult.fromJson(Map<String, dynamic> json) {
    return BookLookupResult(
      isbn: json['isbn'] as String,
      title: json['title'] as String,
      authors: (json['authors'] as List<dynamic>? ?? []).cast<String>(),
      publisher: json['publisher'] as String?,
      publishedDate: json['publishedDate'] as String?,
      coverUrl: json['coverUrl'] as String?,
      description: json['description'] as String?,
      source: json['source'] as String,
    );
  }
}

class UserBook {
  const UserBook({
    required this.id,
    required this.title,
    required this.authors,
    required this.format,
    required this.readingStatus,
    required this.rating,
    required this.memo,
    required this.coverUrl,
    required this.publisher,
    required this.publishedDate,
    required this.description,
    required this.isbn,
    required this.isOwned,
  });

  final String id;
  final String title;
  final List<String> authors;
  final BookFormat format;
  final ReadingStatus readingStatus;
  final int? rating;
  final String? memo;
  final String? coverUrl;
  final String? publisher;
  final String? publishedDate;
  final String? description;
  final String? isbn;
  final bool isOwned;

  factory UserBook.fromJson(Map<String, dynamic> json) {
    return UserBook(
      id: json['id'] as String,
      title: json['title'] as String,
      authors: (json['authors'] as List<dynamic>? ?? []).cast<String>(),
      format: BookFormat.values.byName(json['format'] as String),
      readingStatus: ReadingStatus.values.byName(json['readingStatus'] as String),
      rating: json['rating'] as int?,
      memo: json['memo'] as String?,
      coverUrl: json['coverUrl'] as String?,
      publisher: json['publisher'] as String?,
      publishedDate: json['publishedDate'] as String?,
      description: json['description'] as String?,
      isbn: json['isbn'] as String?,
      isOwned: json['isOwned'] as bool? ?? true,
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
      'memo': memo,
      'coverUrl': coverUrl,
      'publisher': publisher,
      'publishedDate': publishedDate,
      'description': description,
      'isOwned': isOwned,
    };
  }
}

