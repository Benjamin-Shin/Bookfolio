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

class SharedLibraryBookSummary {
  const SharedLibraryBookSummary({
    required this.id,
    required this.libraryId,
    required this.bookId,
    required this.title,
    required this.authors,
    this.isbn,
    this.coverUrl,
    this.location,
    this.memo,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String libraryId;
  final String bookId;
  final String title;
  final List<String> authors;
  final String? isbn;
  final String? coverUrl;
  final String? location;
  final String? memo;
  final String createdAt;
  final String updatedAt;

  factory SharedLibraryBookSummary.fromJson(Map<String, dynamic> json) {
    return SharedLibraryBookSummary(
      id: json['id'] as String,
      libraryId: json['libraryId'] as String,
      bookId: json['bookId'] as String,
      title: json['title'] as String,
      authors: (json['authors'] as List<dynamic>? ?? []).map((e) => e.toString()).toList(),
      isbn: json['isbn'] as String?,
      coverUrl: json['coverUrl'] as String?,
      location: json['location'] as String?,
      memo: json['memo'] as String?,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}
