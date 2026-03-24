import 'dart:convert';

import 'package:bookfolio_mobile/src/models/book_models.dart';
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

