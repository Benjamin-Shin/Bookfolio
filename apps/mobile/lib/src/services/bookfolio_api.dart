import 'dart:convert';

import 'package:bookfolio_mobile/src/models/aladin_bestseller_models.dart';
import 'package:bookfolio_mobile/src/models/book_models.dart'
    show
        BookLookupResult,
        BookOneLinerItem,
        ReadingEventItem,
        UserBook,
        UserBookMemo;
import 'package:bookfolio_mobile/src/models/shared_library_models.dart';
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

  Future<List<UserBook>> fetchBooks() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/me/books'),
      headers: await _headers(),
    );
    _throwIfFailed(response);
    final decoded = jsonDecode(response.body) as List<dynamic>;
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
  /// - 2026-03-28: 북폴리오 집계(소장·완독·포인트·인기 도서)
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

