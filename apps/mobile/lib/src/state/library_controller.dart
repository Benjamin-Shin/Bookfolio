import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:flutter/foundation.dart';

class LibraryController extends ChangeNotifier {
  final BookfolioApi _api = BookfolioApi();

  AuthController? _auth;
  List<UserBook> _books = const [];
  bool _isLoading = false;
  String? _error;

  List<UserBook> get books => _books;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void attach(AuthController auth) {
    _api.accessToken = () => auth.session?.accessToken;
    final sessionChanged = _auth?.session?.accessToken != auth.session?.accessToken;
    _auth = auth;
    if (auth.isAuthenticated && sessionChanged) {
      loadBooks();
    }
    if (!auth.isAuthenticated) {
      _books = const [];
      _error = null;
    }
  }

  Future<void> loadBooks() async {
    if (!(_auth?.isAuthenticated ?? false)) return;
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _books = await _api.fetchBooks();
    } catch (error) {
      _error = error.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createBook(UserBook book) async {
    final created = await _api.createBook(book);
    _books = [created, ..._books];
    notifyListeners();
  }

  Future<void> updateBook(String id, Map<String, dynamic> payload) async {
    final updated = await _api.updateBook(id, payload);
    _books = _books.map((book) => book.id == id ? updated : book).toList();
    notifyListeners();
  }

  Future<void> deleteBook(String id) async {
    await _api.deleteBook(id);
    _books = _books.where((book) => book.id != id).toList();
    notifyListeners();
  }

  Future<BookLookupResult> lookupByIsbn(String isbn) {
    return _api.lookupByIsbn(isbn);
  }

  /// History:
  /// - 2026-03-24: 제목 검색 API 위임 추가
  Future<List<BookLookupResult>> searchBooksByTitle(String query) {
    return _api.searchBooksByTitle(query);
  }
}

