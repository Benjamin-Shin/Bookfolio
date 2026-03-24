class SharedLibrarySummary {
  const SharedLibrarySummary({
    required this.id,
    required this.name,
    this.description,
    required this.kind,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
    required this.myRole,
  });

  final String id;
  final String name;
  final String? description;
  final String kind;
  final String createdBy;
  final String createdAt;
  final String updatedAt;
  final String myRole;

  factory SharedLibrarySummary.fromJson(Map<String, dynamic> json) {
    return SharedLibrarySummary(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      kind: json['kind'] as String,
      createdBy: json['createdBy'] as String,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
      myRole: json['myRole'] as String,
    );
  }

  String get kindLabel {
    switch (kind) {
      case 'family':
        return '가족';
      case 'club':
        return '모임';
      default:
        return kind;
    }
  }
}

class SharedLibraryOwnerRow {
  const SharedLibraryOwnerRow({
    required this.userId,
    required this.email,
    this.name,
    required this.userBookId,
    required this.readingStatus,
    this.location,
    this.memo,
    required this.linkedAt,
  });

  final String userId;
  final String email;
  final String? name;
  final String userBookId;
  final String readingStatus;
  final String? location;
  final String? memo;
  final String linkedAt;

  factory SharedLibraryOwnerRow.fromJson(Map<String, dynamic> json) {
    return SharedLibraryOwnerRow(
      userId: json['userId'] as String,
      email: json['email'] as String? ?? '',
      name: json['name'] as String?,
      userBookId: json['userBookId'] as String,
      readingStatus: json['readingStatus'] as String? ?? 'unread',
      location: json['location'] as String?,
      memo: json['memo'] as String?,
      linkedAt: json['linkedAt'] as String,
    );
  }

  String get displayName {
    final n = name?.trim();
    if (n != null && n.isNotEmpty) return n;
    return email;
  }
}

/// API: `LibraryAggregatedBookRow` — `book_id` 기준 합친 한 줄.
class SharedLibraryBookSummary {
  const SharedLibraryBookSummary({
    required this.libraryId,
    required this.bookId,
    required this.title,
    required this.authors,
    this.isbn,
    this.coverUrl,
    this.genreSlugs,
    required this.owners,
    required this.updatedAt,
  });

  final String libraryId;
  final String bookId;
  final String title;
  final List<String> authors;
  final String? isbn;
  final String? coverUrl;
  /// 공유 서지 `books.genre_slugs` (웹 API camelCase `genreSlugs`).
  final List<String>? genreSlugs;
  final List<SharedLibraryOwnerRow> owners;
  final String updatedAt;

  factory SharedLibraryBookSummary.fromJson(Map<String, dynamic> json) {
    final ownersRaw = json['owners'] as List<dynamic>? ?? const [];
    final genresRaw = json['genreSlugs'] as List<dynamic>?;
    return SharedLibraryBookSummary(
      libraryId: json['libraryId'] as String,
      bookId: json['bookId'] as String,
      title: json['title'] as String,
      authors: (json['authors'] as List<dynamic>? ?? []).map((e) => e.toString()).toList(),
      isbn: json['isbn'] as String?,
      coverUrl: json['coverUrl'] as String?,
      genreSlugs: genresRaw == null
          ? null
          : genresRaw.map((e) => e.toString()).where((s) => s.isNotEmpty).toList(),
      owners: ownersRaw
          .map((e) => SharedLibraryOwnerRow.fromJson(e as Map<String, dynamic>))
          .toList(),
      updatedAt: json['updatedAt'] as String,
    );
  }

  String get ownersLabel {
    if (owners.isEmpty) return '';
    return owners.map((o) => o.displayName).join(', ');
  }
}
