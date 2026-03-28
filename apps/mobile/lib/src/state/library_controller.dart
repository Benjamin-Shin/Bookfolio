import 'dart:math' as math;

import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:flutter/foundation.dart';

class LibraryController extends ChangeNotifier {
  final BookfolioApi _api = BookfolioApi();

  /// 상세 화면 등에서 토큰이 붙은 API 클라이언트가 필요할 때 사용합니다.
  ///
  /// History:
  /// - 2026-03-26: 메모·이벤트·한줄평 API 연동용 노출
  BookfolioApi get api => _api;

  AuthController? _auth;
  List<UserBook> _books = const [];
  bool _isLoading = false;
  String? _error;

  static const int defaultPageSize = 20;

  int _page = 1;
  int _pageSize = defaultPageSize;
  int _total = 0;
  String _searchQuery = '';
  String? _readingStatusFilter;

  List<UserBook> get books => _books;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get booksTotal => _total;
  int get booksPage => _page;
  int get booksPageSize => _pageSize;

  int get booksTotalPages {
    if (_pageSize <= 0) return 1;
    if (_total <= 0) return 1;
    var tp = math.max(1, (_total + _pageSize - 1) ~/ _pageSize);
    // 서버 total이 실제보다 작을 때: 현재 쪽이 가득 찬 마지막 쪽처럼 보이면 다음 쪽 가능
    if (_books.isNotEmpty && _books.length >= _pageSize && _page >= tp) {
      return _page + 1;
    }
    return tp;
  }

  /// History:
  /// - 2026-03-29: total 과소 시에도 `booksTotalPages`와 함께 사용
  bool get canGoToPrevBooksPage => !_isLoading && _page > 1;

  /// History:
  /// - 2026-03-29: 마지막 쪽이 `pageSize`만큼 찬 경우 다음 쪽 시도 가능
  bool get canGoToNextBooksPage {
    if (_isLoading || _books.isEmpty) return false;
    if (_page < booksTotalPages) return true;
    return _books.length >= _pageSize;
  }

  String get booksSearchQuery => _searchQuery;

  String? get booksReadingStatusFilter => _readingStatusFilter;

  void attach(AuthController auth) {
    _api.accessToken = () => auth.session?.accessToken;
    final sessionChanged = _auth?.session?.accessToken != auth.session?.accessToken;
    _auth = auth;
    if (auth.isAuthenticated && sessionChanged) {
      _page = 1;
      _searchQuery = '';
      _readingStatusFilter = null;
      loadBooks();
    }
    if (!auth.isAuthenticated) {
      _books = const [];
      _error = null;
      _total = 0;
      _page = 1;
    }
  }

  /// 현재 필터·페이지 크기로 n페이지를 불러옵니다.
  ///
  /// History:
  /// - 2026-03-29: `fetchBooksPaged` 기반 (100권 제한 해소)
  Future<void> loadBooksAtPage(int page) async {
    if (!(_auth?.isAuthenticated ?? false)) return;
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      var requestPage = math.max(1, page);
      var result = await _api.fetchBooksPaged(
        page: requestPage,
        pageSize: _pageSize,
        search: _searchQuery.isEmpty ? null : _searchQuery,
        readingStatus: _readingStatusFilter,
      );
      if (result.items.isEmpty && requestPage > 1) {
        requestPage -= 1;
        result = await _api.fetchBooksPaged(
          page: requestPage,
          pageSize: _pageSize,
          search: _searchQuery.isEmpty ? null : _searchQuery,
          readingStatus: _readingStatusFilter,
        );
      }
      _books = result.items;
      final observedMin = (result.page - 1) * result.pageSize + result.items.length;
      _total = math.max(result.total, observedMin);
      _page = result.page;
      _pageSize = result.pageSize;
    } catch (error) {
      _error = error.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadBooks() => loadBooksAtPage(_page);

  Future<void> setBooksListFilters({
    String? search,
    String? readingStatus,
    bool readingStatusAll = false,
  }) async {
    if (search != null) {
      _searchQuery = search.trim();
    }
    if (readingStatusAll) {
      _readingStatusFilter = null;
    } else if (readingStatus != null) {
      _readingStatusFilter = readingStatus == 'all' ? null : readingStatus;
    }
    await loadBooksAtPage(1);
  }

  Future<void> goToBooksPage(int page) async {
    final last = booksTotalPages;
    final p = page.clamp(1, last);
    await loadBooksAtPage(p);
  }

  Future<void> createBook(UserBook book) async {
    await _api.createBook(book);
    _page = 1;
    await loadBooksAtPage(1);
  }

  Future<void> updateBook(String id, Map<String, dynamic> payload) async {
    await _api.updateBook(id, payload);
    await loadBooksAtPage(_page);
  }

  Future<void> deleteBook(String id) async {
    await _api.deleteBook(id);
    await loadBooksAtPage(_page);
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

