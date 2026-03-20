import 'dart:convert';

import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:http/http.dart' as http;

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

  Future<BookLookupResult> lookupByIsbn(String isbn) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/api/books/lookup-by-isbn'),
      headers: await _headers(),
      body: jsonEncode({'isbn': isbn}),
    );
    _throwIfFailed(response);
    return BookLookupResult.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  void _throwIfFailed(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return;
    }
    throw Exception('Request failed: ${response.statusCode} ${response.body}');
  }
}

