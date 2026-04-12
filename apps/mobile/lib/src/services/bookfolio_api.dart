import 'dart:convert';

import 'package:seogadam_mobile/src/models/aladin_bestseller_models.dart';
import 'package:seogadam_mobile/src/models/canon_book_models.dart';
import 'package:seogadam_mobile/src/models/discover_models.dart';
import 'package:seogadam_mobile/src/models/book_models.dart'
    show
        BookLookupResult,
        BookOneLinerItem,
        ReadingEventItem,
        UserBook,
        UserBookMemo;
import 'package:seogadam_mobile/src/models/shared_library_models.dart';
import 'package:http/http.dart' as http;

/// API가 JSON `{ "error": "..." }` 로 돌려준 메시지를 담습니다 (예: 중복 등록 409).
class BookfolioApiException implements Exception {
  BookfolioApiException(this.statusCode, this.message);

  final int statusCode;
  final String message;

  @override
  String toString() => message;
}

/// `GET /api/me/points/balance` 응답.
///
/// History:
/// - 2026-03-28: 모바일 프로필용 포인트·VIP
class PointsBalanceResult {
  PointsBalanceResult({required this.balance, required this.vipActive});

  final int balance;
  final bool vipActive;

  factory PointsBalanceResult.fromJson(Map<String, dynamic> json) {
    final b = json['balance'];
    final v = json['vipActive'];
    return PointsBalanceResult(
      balance: b is int ? b : (b is num ? b.toInt() : 0),
      vipActive: v == true,
    );
  }
}

/// `GET /api/me/stats/owned-books-price` 응답 (웹 대시보드·동일 RPC).
///
/// History:
/// - 2026-03-29: 소장 책 가격 합계(모바일 내 서재)
class UserOwnedBooksPriceStats {
  const UserOwnedBooksPriceStats({
    required this.totalKrw,
    required this.pricedOwnedCount,
    required this.ownedCount,
  });

  final int totalKrw;
  final int pricedOwnedCount;
  final int ownedCount;

  factory UserOwnedBooksPriceStats.fromJson(Map<String, dynamic> json) {
    int asInt(dynamic v) {
      if (v is int) return v;
      if (v is num) return v.toInt();
      if (v is String) return int.tryParse(v) ?? 0;
      return 0;
    }

    return UserOwnedBooksPriceStats(
      totalKrw: asInt(json['totalKrw']),
      pricedOwnedCount: asInt(json['pricedOwnedCount']),
      ownedCount: asInt(json['ownedCount']),
    );
  }
}

/// `GET /api/me/books?page=&pageSize=` 응답.
///
/// History:
/// - 2026-03-29: 내 서재 목록 페이지네이션용
class UserBooksPageResult {
  const UserBooksPageResult({
    required this.items,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  final List<UserBook> items;
  final int total;
  final int page;
  final int pageSize;
}

/// `GET /api/me/stats/personal-library-summary` 저자 TOP 행.
///
/// History:
/// - 2026-04-02: 신규
class PersonalLibraryAuthorTop {
  const PersonalLibraryAuthorTop({required this.name, required this.count});

  final String name;
  final int count;

  factory PersonalLibraryAuthorTop.fromJson(Map<String, dynamic> json) {
    final c = json['count'];
    return PersonalLibraryAuthorTop(
      name: json['name'] as String? ?? '',
      count: c is int ? c : (c is num ? c.toInt() : int.tryParse('$c') ?? 0),
    );
  }
}

/// `GET /api/me/stats/personal-library-summary` 응답.
///
/// History:
/// - 2026-04-02: `topAuthorsByOwnedCount` 등
/// - 2026-04-02: 모바일 내 서재 허브·분석 지표
class PersonalLibrarySummary {
  const PersonalLibrarySummary({
    required this.physicalPaperCount,
    required this.ownedWorkCount,
    required this.readingPaperCount,
    required this.completedCount,
    required this.unreadCount,
    required this.lifeBookCount,
    required this.totalListPriceKrw,
    required this.memoCount,
    required this.oneLinerCount,
    required this.readCompleteThisYearCount,
    required this.readCompleteThisMonthCount,
    required this.totalPagesRead,
    required this.topAuthorsByOwnedCount,
  });

  final int physicalPaperCount;
  final int ownedWorkCount;
  final int readingPaperCount;
  final int completedCount;
  final int unreadCount;
  final int lifeBookCount;
  final int totalListPriceKrw;
  final int memoCount;
  final int oneLinerCount;
  final int readCompleteThisYearCount;
  final int readCompleteThisMonthCount;
  final int totalPagesRead;
  final List<PersonalLibraryAuthorTop> topAuthorsByOwnedCount;

  factory PersonalLibrarySummary.fromJson(Map<String, dynamic> json) {
    int g(String k) {
      final v = json[k];
      if (v is int) return v;
      if (v is num) return v.toInt();
      if (v is String) return int.tryParse(v) ?? 0;
      return 0;
    }

    final topRaw = json['topAuthorsByOwnedCount'];
    final top = topRaw is List<dynamic>
        ? topRaw.map((e) => PersonalLibraryAuthorTop.fromJson(e as Map<String, dynamic>)).toList()
        : const <PersonalLibraryAuthorTop>[];

    return PersonalLibrarySummary(
      physicalPaperCount: g('physicalPaperCount'),
      ownedWorkCount: g('ownedWorkCount'),
      readingPaperCount: g('readingPaperCount'),
      completedCount: g('completedCount'),
      unreadCount: g('unreadCount'),
      lifeBookCount: g('lifeBookCount'),
      totalListPriceKrw: g('totalListPriceKrw'),
      memoCount: g('memoCount'),
      oneLinerCount: g('oneLinerCount'),
      readCompleteThisYearCount: g('readCompleteThisYearCount'),
      readCompleteThisMonthCount: g('readCompleteThisMonthCount'),
      totalPagesRead: g('totalPagesRead'),
      topAuthorsByOwnedCount: top,
    );
  }
}

/// `GET/POST /api/me/profile` 응답.
///
/// History:
/// - 2026-04-06: `onboardingCompletedAt`
/// - 2026-04-06: `annualReadingGoal`
/// - 2026-04-02: 인구통계 필드
class MeAppProfile {
  const MeAppProfile({
    required this.id,
    required this.email,
    required this.displayName,
    required this.avatarUrl,
    required this.gender,
    required this.birthDate,
    required this.genderPublic,
    required this.birthDatePublic,
    this.annualReadingGoal,
    this.onboardingCompletedAt,
  });

  final String id;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final String? gender;
  final String? birthDate;
  final bool genderPublic;
  final bool birthDatePublic;
  /// 올해 완독 목표 권수. null이면 미설정.
  final int? annualReadingGoal;
  /// 서버 ISO 8601. null/빈 문자열이면 온보딩 미완료.
  final String? onboardingCompletedAt;

  factory MeAppProfile.fromJson(Map<String, dynamic> json) {
    final g = json['annualReadingGoal'];
    final oc = json['onboardingCompletedAt']?.toString();
    return MeAppProfile(
      id: json['id'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      gender: json['gender'] as String?,
      birthDate: json['birthDate'] as String?,
      genderPublic: json['genderPublic'] == true,
      birthDatePublic: json['birthDatePublic'] == true,
      annualReadingGoal: g is int ? g : (g is num ? g.toInt() : null),
      onboardingCompletedAt: (oc != null && oc.isNotEmpty) ? oc : null,
    );
  }
}

/// `GET /api/me/reading-events/by-day` 행.
///
/// History:
/// - 2026-04-02: 캘린더 셀 표지용
class ReadingEventDayRow {
  const ReadingEventDayRow({
    required this.userBookId,
    required this.coverUrl,
    required this.title,
  });

  final String userBookId;
  final String? coverUrl;
  final String title;

  factory ReadingEventDayRow.fromJson(Map<String, dynamic> json) {
    return ReadingEventDayRow(
      userBookId:
          json['userBookId'] as String? ?? json['user_book_id'] as String? ?? '',
      coverUrl: json['coverUrl'] as String? ?? json['cover_url'] as String?,
      title: json['title'] as String? ?? '',
    );
  }
}

/// `GET /api/me/mobile-home` 응답 — 모바일 홈 탭 일괄 로드.
///
/// History:
/// - 2026-04-12: 신규
class MobileHomeBundle {
  const MobileHomeBundle({
    required this.profile,
    required this.personalLibrarySummary,
    required this.points,
    required this.readingBook,
    required this.unreadRecommend,
  });

  final MeAppProfile? profile;
  final PersonalLibrarySummary personalLibrarySummary;
  final PointsBalanceResult? points;
  final UserBook? readingBook;
  final List<UserBook> unreadRecommend;

  factory MobileHomeBundle.fromJson(Map<String, dynamic> json) {
    final p = json['profile'];
    final pts = json['points'];
    final sum = json['personalLibrarySummary'];
    final read = json['readingBook'];
    final rawUnread = json['unreadRecommend'];

    return MobileHomeBundle(
      profile: p is Map<String, dynamic> ? MeAppProfile.fromJson(p) : null,
      personalLibrarySummary: PersonalLibrarySummary.fromJson(sum as Map<String, dynamic>),
      points: pts is Map<String, dynamic> ? PointsBalanceResult.fromJson(pts) : null,
      readingBook: read is Map<String, dynamic> ? UserBook.fromJson(read) : null,
      unreadRecommend: rawUnread is List<dynamic>
          ? rawUnread.map((e) => UserBook.fromJson(e as Map<String, dynamic>)).toList()
          : const <UserBook>[],
    );
  }
}

class BookfolioApi {
  BookfolioApi({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;
  final String _baseUrl = const String.fromEnvironment('BOOKFOLIO_API_BASE_URL');

  /// [AuthController] 등에서 설정합니다.
  String? Function()? accessToken;

  Future<Map<String, String>> _headers() async {
    final token = accessToken?.call();
    return {
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  /// 페이지 단위 목록 (`page` 쿼리가 있을 때 서버는 `{ items, total, page, pageSize }` 반환).
  ///
  /// History:
  /// - 2026-03-29: 모바일 내 서재 그리드 페이지네이션
  Future<UserBooksPageResult> fetchBooksPaged({
    int page = 1,
    int pageSize = 20,
    String? search,
    String? readingStatus,
    String? format,
  }) async {
    final qp = <String, String>{
      'page': '${page.clamp(1, 1 << 20)}',
      'pageSize': '${pageSize.clamp(1, 100)}',
    };
    final q = search?.trim();
    if (q != null && q.isNotEmpty) {
      qp['q'] = q;
    }
    final rs = readingStatus?.trim();
    if (rs != null && rs.isNotEmpty && rs != 'all') {
      qp['readingStatus'] = rs;
    }
    final fmt = format?.trim();
    if (fmt != null && fmt.isNotEmpty && fmt != 'all') {
      qp['format'] = fmt;
    }
    final uri = Uri.parse('$_baseUrl/api/me/books').replace(queryParameters: qp);
    final response = await _client.get(uri, headers: await _headers());
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body);
    if (decoded is List<dynamic>) {
      final items = decoded.map((e) => UserBook.fromJson(e as Map<String, dynamic>)).toList();
      return UserBooksPageResult(
        items: items,
        total: items.length,
        page: 1,
        pageSize: items.length,
      );
    }
    if (decoded is! Map<String, dynamic>) {
      throw BookfolioApiException(500, '도서 목록 응답 형식이 올바르지 않습니다.');
    }
    final listRaw = decoded['items'];
    if (listRaw is! List<dynamic>) {
      throw BookfolioApiException(500, '도서 목록 응답 형식이 올바르지 않습니다.');
    }
    final items = listRaw.map((e) => UserBook.fromJson(e as Map<String, dynamic>)).toList();
    final totalRaw = decoded['total'] ?? decoded['Total'];
    int total = 0;
    if (totalRaw is int) {
      total = totalRaw;
    } else if (totalRaw is num) {
      total = totalRaw.toInt();
    } else if (totalRaw is String) {
      total = int.tryParse(totalRaw) ?? 0;
    }
    final pageRaw = decoded['page'];
    final outPage = pageRaw is int
        ? pageRaw
        : pageRaw is num
            ? pageRaw.toInt()
            : page;
    final psRaw = decoded['pageSize'];
    final outPs = psRaw is int
        ? psRaw
        : psRaw is num
            ? psRaw.toInt()
            : pageSize;
    return UserBooksPageResult(
      items: items,
      total: total,
      page: outPage,
      pageSize: outPs,
    );
  }

  /// History:
  /// - 2026-03-29: `user_owned_books_price_stats`와 동기
  Future<UserOwnedBooksPriceStats> fetchOwnedBooksPriceStats() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/stats/owned-books-price'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    return UserOwnedBooksPriceStats.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<List<UserBook>> fetchBooks() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/books'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body);
    if (decoded is Map<String, dynamic>) {
      final list = decoded['items'];
      if (list is List<dynamic>) {
        return list.map((e) => UserBook.fromJson(e as Map<String, dynamic>)).toList();
      }
    }
    if (decoded is! List<dynamic>) {
      throw BookfolioApiException(500, '도서 목록 응답 형식이 올바르지 않습니다.');
    }
    return decoded
        .map((item) => UserBook.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<UserBook> createBook(UserBook book) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/me/books'),
      headers: await _headers(),
      body: jsonEncode(book.toCreatePayload()),
    );
    _throwIfFailed(response);
    return UserBook.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<UserBook> updateBook(String id, Map<String, dynamic> payload) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/me/books/$id'),
      headers: await _headers(),
      body: jsonEncode({...payload, 'action': 'update'}),
    );
    _throwIfFailed(response);
    return UserBook.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<void> deleteBook(String id) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/me/books/$id'),
      headers: await _headers(),
      body: jsonEncode({'action': 'delete'}),
    );
    _throwIfFailed(response);
  }

  Future<List<SharedLibrarySummary>> fetchSharedLibraries() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/libraries'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body) as List<dynamic>;
    return decoded
        .map((item) => SharedLibrarySummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<SharedLibraryBookSummary>> fetchSharedLibraryBooks(String libraryId) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/libraries/$libraryId/books'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body) as List<dynamic>;
    return decoded
        .map((item) => SharedLibraryBookSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<BookLookupResult> lookupByIsbn(String isbn) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/books/lookup-by-isbn'),
      headers: await _headers(),
      body: jsonEncode({'isbn': isbn}),
    );
    _throwIfFailed(response);
    return BookLookupResult.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  /// 제목·키워드로 메타 검색 (`POST /api/books/search-by-title`).
  ///
  /// History:
  /// - 2026-03-24: 모바일 책 등록용 제목 검색 API 연동
  Future<List<BookLookupResult>> searchBooksByTitle(String query) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/books/search-by-title'),
      headers: await _headers(),
      body: jsonEncode({'query': query}),
    );
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final list = decoded['results'] as List<dynamic>? ?? const [];
    return list.map((e) => BookLookupResult.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// 알라딘 연동 목록(서버가 `ALADIN_BESTSELLER_API_BASE_URL`로 조회).
  ///
  /// History:
  /// - 2026-03-25: `GET /api/me/aladin-bestseller` 연동
  Future<AladinBestsellerFeed> fetchAladinBestsellerFeed() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/aladin-bestseller'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    return AladinBestsellerFeed.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  /// 초이스 신간 등(서버가 `ALADIN_ITEMNEW_API_BASE_URL`로 조회).
  ///
  /// History:
  /// - 2026-03-25: `GET /api/me/aladin-item-new` 연동
  Future<AladinBestsellerFeed> fetchAladinItemNewFeed() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/aladin-item-new'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    return AladinBestsellerFeed.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  /// 발견 탭 — 타인이 먼저 등록한 종이책 캐논(본인 미소장).
  ///
  /// History:
  /// - 2026-04-05: `GET /api/me/discover/community-books`
  Future<List<DiscoverCommunityBook>> fetchDiscoverCommunityBooks({int limit = 30}) async {
    final uri = Uri.parse('$_baseUrl/api/me/discover/community-books').replace(
      queryParameters: {'limit': '$limit'},
    );
    final response = await _client.get(uri, headers: await _headers());
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final raw = decoded['books'] as List<dynamic>? ?? const [];
    return raw.map((e) => DiscoverCommunityBook.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// 캐논 도서 구매 링크·가격 힌트(회원 전용).
  ///
  /// History:
  /// - 2026-04-08: `GET /api/me/canon-books/:bookId/purchase-offers`
  Future<CanonBookPurchaseOffers> fetchCanonBookPurchaseOffers(String bookId) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/canon-books/$bookId/purchase-offers'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    return CanonBookPurchaseOffers.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  /// 캐논 도서 공개 한줄평(회원 전용).
  ///
  /// History:
  /// - 2026-04-08: `GET /api/me/canon-books/:bookId/community-one-liners`
  Future<List<CanonCommunityOneLiner>> fetchCanonCommunityOneLiners(String bookId, {int limit = 50}) async {
    final uri = Uri.parse('$_baseUrl/api/me/canon-books/$bookId/community-one-liners').replace(
      queryParameters: {'limit': '$limit'},
    );
    final response = await _client.get(uri, headers: await _headers());
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final raw = decoded['items'] as List<dynamic>? ?? const [];
    return raw.map((e) => CanonCommunityOneLiner.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// `GET /api/me/books/:id/memos`
  ///
  /// History:
  /// - 2026-03-26: 마크다운 메모 다건 API
  Future<List<UserBookMemo>> fetchUserBookMemos(String userBookId) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/books/$userBookId/memos'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body) as List<dynamic>;
    return decoded.map((e) => UserBookMemo.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<UserBookMemo> createUserBookMemo(String userBookId, String bodyMd) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/me/books/$userBookId/memos'),
      headers: await _headers(),
      body: jsonEncode({'action': 'create', 'bodyMd': bodyMd}),
    );
    _throwIfFailed(response);
    return UserBookMemo.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<void> upsertOneLiner(String userBookId, String body) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/me/books/$userBookId/one-liner'),
      headers: await _headers(),
      body: jsonEncode({'action': 'upsert', 'body': body}),
    );
    _throwIfFailed(response);
  }

  Future<void> clearOneLiner(String userBookId) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/me/books/$userBookId/one-liner'),
      headers: await _headers(),
      body: jsonEncode({'action': 'clear'}),
    );
    _throwIfFailed(response);
  }

  Future<List<BookOneLinerItem>> fetchBookOneLiners(String bookId) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/books/$bookId/one-liners'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body) as List<dynamic>;
    return decoded.map((e) => BookOneLinerItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<ReadingEventItem>> fetchReadingEvents(String userBookId) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/books/$userBookId/reading-events'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body) as List<dynamic>;
    return decoded.map((e) => ReadingEventItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ReadingEventItem> appendReadingEvent(
    String userBookId,
    String eventType, {
    Map<String, dynamic>? payload,
    String? setReadingStatus,
  }) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/me/books/$userBookId/reading-events'),
      headers: await _headers(),
      body: jsonEncode({
        'action': 'append',
        'eventType': eventType,
        'payload': payload ?? <String, dynamic>{},
        if (setReadingStatus != null) 'setReadingStatus': setReadingStatus,
      }),
    );
    _throwIfFailed(response);
    return ReadingEventItem.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  /// `GET /api/me/stats/bookfolio-aggregate?top=10`
  ///
  /// History:
  /// - 2026-04-07: 주석 카피 서가담화
  /// - 2026-03-28: 커뮤니티 집계(소장·완독·포인트·인기 도서)
  Future<Map<String, dynamic>> fetchBookfolioAggregate({int top = 10}) async {
    final uri = Uri.parse('$_baseUrl/api/me/stats/bookfolio-aggregate').replace(
      queryParameters: {'top': '$top'},
    );
    final response = await _client.get(uri, headers: await _headers());
    _throwIfFailed(response);
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  /// `GET /api/me/stats/reading-leaderboard?kind=completed|owned`
  Future<Map<String, dynamic>> fetchReadingLeaderboard(String kind) async {
    final uri = Uri.parse('$_baseUrl/api/me/stats/reading-leaderboard').replace(
      queryParameters: {'kind': kind, 'top': '20'},
    );
    final response = await _client.get(uri, headers: await _headers());
    _throwIfFailed(response);
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  /// `GET /api/me/reading-events/calendar?from=&to=` (YYYY-MM-DD)
  /// 회원 탈퇴 — 웹 헤더 계정과 동일 (`DELETE /api/me/account`).
  ///
  /// History:
  /// - 2026-03-29: 모바일 프로필 탈퇴 연동
  Future<void> deleteAccount() async {
    final response = await _client.delete(
      Uri.parse('$_baseUrl/api/me/account'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
  }

  /// `GET /api/me/mobile-home` — 홈 탭용 프로필·요약·포인트·도서 샘플 일괄 조회.
  ///
  /// History:
  /// - 2026-04-12: 신규
  Future<MobileHomeBundle> fetchMobileHome() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/mobile-home'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    return MobileHomeBundle.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  /// `GET /api/me/points/balance`
  Future<PointsBalanceResult> fetchPointsBalance() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/points/balance'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    return PointsBalanceResult.fromJson(decoded);
  }

  /// 테마·유료 기능용 — `POST /api/me/points/apply-event`
  Future<Map<String, dynamic>> applyPointsEvent({
    required String eventCode,
    required String idempotencyKey,
    String? refType,
    String? refId,
  }) async {
    final payload = <String, dynamic>{
      'eventCode': eventCode,
      'idempotencyKey': idempotencyKey,
      if (refType != null && refType.isNotEmpty) 'refType': refType,
      if (refId != null && refId.isNotEmpty) 'refId': refId,
    };
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/me/points/apply-event'),
      headers: await _headers(),
      body: jsonEncode(payload),
    );
    _throwIfFailed(response);
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  /// `GET /api/me/profile`
  ///
  /// History:
  /// - 2026-04-02: 신규
  Future<MeAppProfile> fetchMeProfile() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/profile'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    return MeAppProfile.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  /// `POST /api/me/profile` (`action: update`). 본문은 서버가 부분 갱신으로 처리합니다.
  ///
  /// History:
  /// - 2026-04-06: `onboardingCompleted` — 온보딩 완료 플래그
  /// - 2026-04-02: 신규
  Future<MeAppProfile> updateMeProfile(Map<String, dynamic> fields) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/me/profile'),
      headers: await _headers(),
      body: jsonEncode({'action': 'update', ...fields}),
    );
    _throwIfFailed(response);
    return MeAppProfile.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  /// `GET /api/me/stats/personal-library-summary`
  ///
  /// History:
  /// - 2026-04-02: 신규
  Future<PersonalLibrarySummary> fetchPersonalLibrarySummary() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/stats/personal-library-summary'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    return PersonalLibrarySummary.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  /// `GET /api/me/reading-events/by-day?day=YYYY-MM-DD`
  ///
  /// History:
  /// - 2026-04-02: 캘린더 날짜별 표지(첫 이벤트)용
  Future<List<ReadingEventDayRow>> fetchReadingEventsByDay(String dayYmd) async {
    final uri = Uri.parse('$_baseUrl/api/me/reading-events/by-day').replace(
      queryParameters: {'day': dayYmd},
    );
    final response = await _client.get(uri, headers: await _headers());
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) return const [];
    final items = decoded['items'];
    if (items is! List<dynamic>) return const [];
    return items.map((e) => ReadingEventDayRow.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Map<String, int>> fetchReadingEventsCalendar(String from, String to) async {
    final uri = Uri.parse('$_baseUrl/api/me/reading-events/calendar').replace(
      queryParameters: {'from': from, 'to': to},
    );
    final response = await _client.get(uri, headers: await _headers());
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final out = <String, int>{};
    for (final e in decoded.entries) {
      final n = (e.value as num?)?.toInt();
      if (n != null) out[e.key] = n;
    }
    return out;
  }

  void _throwIfFailed(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return;
    }
    var message = '요청에 실패했습니다. (${response.statusCode})';
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic> && decoded['error'] is String) {
        message = decoded['error'] as String;
      }
    } catch (_) {
      // 본문이 JSON이 아니면 위 기본 메시지 유지
    }
    throw BookfolioApiException(response.statusCode, message);
  }
}

