import 'dart:async';
import 'dart:math' as math;

import 'package:seogadam_mobile/src/local/library_offline_store.dart';
import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/util/jwt_sub.dart';
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
  /// 목록에 없을 때(필터·쪽) 상세 갱신용 스냅샷.
  final Map<String, UserBook> _bookDetailOverrides = {};
  bool _isLoading = false;
  String? _error;

  static const int defaultPageSize = 20;

  /// 도서 목록 API 대기 한도. 초과 시 로컬 캐시 안내 다이얼로그 후보.
  ///
  /// History:
  /// - 2026-04-08: 오프라인 폴백 UX
  static const Duration booksListRequestTimeout = Duration(seconds: 22);

  int _page = 1;
  int _pageSize = defaultPageSize;
  int _total = 0;
  String _searchQuery = '';
  String? _readingStatusFilter;
  UserOwnedBooksPriceStats? _ownedBooksPriceStats;

  /// 목록 요청이 [booksListRequestTimeout]으로 끊긴 뒤, UI에서 한 번만 소비.
  bool _pendingBooksListTimeoutPrompt = false;

  /// [applyDefaultPaperListFromLocalCache]로 채운 목록(페이지네이션 단순화).
  bool _booksFromLocalCacheOnly = false;

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

  /// 웹 대시보드와 동일한 소장 가격 집계. 로드 실패 시 null.
  ///
  /// History:
  /// - 2026-03-29: `fetchOwnedBooksPriceStats` 연동
  UserOwnedBooksPriceStats? get ownedBooksPriceStats => _ownedBooksPriceStats;

  /// 로컬 SQLite에서 읽어 표시 중(타임아웃 후 사용자가 확인한 경우 등).
  bool get booksFromLocalCacheOnly => _booksFromLocalCacheOnly;

  /// [applyDefaultPaperListFromLocalCache] 직후 메타의 동기 시각(ms). 없으면 null.
  int? get localCacheLastSyncedAtMs => _localCacheLastSyncedAtMs;

  int? _localCacheLastSyncedAtMs;

  /// [LibraryBrowseTab] 등에서 리스너로 감지 후 호출 — true면 소비됨.
  bool consumeBooksListLoadTimeoutPrompt() {
    if (!_pendingBooksListTimeoutPrompt) return false;
    _pendingBooksListTimeoutPrompt = false;
    return true;
  }

  void attach(AuthController auth) {
    _api.accessToken = () => auth.session?.accessToken;
    final sessionChanged = _auth?.session?.accessToken != auth.session?.accessToken;
    _auth = auth;
    if (auth.isAuthenticated && sessionChanged) {
      _page = 1;
      _searchQuery = '';
      _readingStatusFilter = null;
      _bookDetailOverrides.clear();
      loadBooks();
    }
    if (!auth.isAuthenticated) {
      _books = const [];
      _bookDetailOverrides.clear();
      _error = null;
      _total = 0;
      _page = 1;
      _ownedBooksPriceStats = null;
      _pendingBooksListTimeoutPrompt = false;
      _booksFromLocalCacheOnly = false;
      _localCacheLastSyncedAtMs = null;
      LibraryOfflineStore.clearLibraryMirror().catchError((Object e, StackTrace st) {
        debugPrint('LibraryOfflineStore.clearLibraryMirror: $e\n$st');
      });
    }
  }

  /// 상세 화면용: 현재 목록·오버라이드·폴백 순으로 `user_book`을 고릅니다.
  ///
  /// History:
  /// - 2026-04-02: 필터/쪽 밖 도서 상세에서 `readingStatus` 등 즉시 반영
  UserBook bookForDetail(UserBook fallback) {
    for (final b in _books) {
      if (b.id == fallback.id) {
        return b;
      }
    }
    return _bookDetailOverrides[fallback.id] ?? fallback;
  }

  void _rememberUpdatedBook(UserBook updated) {
    final ix = _books.indexWhere((b) => b.id == updated.id);
    if (ix >= 0) {
      _books = List<UserBook>.from(_books)..[ix] = updated;
      _bookDetailOverrides.remove(updated.id);
    } else {
      _bookDetailOverrides[updated.id] = updated;
    }
    notifyListeners();
  }

  /// 현재 필터·페이지 크기로 n페이지를 불러옵니다.
  ///
  /// History:
  /// - 2026-03-29: `fetchBooksPaged` 기반 (100권 제한 해소)
  /// - 2026-04-08: 검색·읽기상태 필터 없을 때 Drift에 종이책 목록 페이지 미러(오프라인 동기 1차)
  /// - 2026-04-08: 요청 타임아웃 시 기본 목록이면 캐시 안내 플래그(필터·검색 중이면 일반 오류만)
  Future<void> loadBooksAtPage(int page) async {
    if (!(_auth?.isAuthenticated ?? false)) return;
    _isLoading = true;
    _error = null;
    notifyListeners();

    Future<UserOwnedBooksPriceStats?> safePriceStats() async {
      try {
        return await _api.fetchOwnedBooksPriceStats();
      } catch (_) {
        return null;
      }
    }

    final statsFuture = safePriceStats();

    Future<UserBooksPageResult> fetchPaged(int requestPage) {
      return _api
          .fetchBooksPaged(
            page: requestPage,
            pageSize: _pageSize,
            search: _searchQuery.isEmpty ? null : _searchQuery,
            readingStatus: _readingStatusFilter,
            format: 'paper',
          )
          .timeout(booksListRequestTimeout);
    }

    final bool defaultPaperListScope =
        _searchQuery.isEmpty && _readingStatusFilter == null;

    try {
      var requestPage = math.max(1, page);
      var result = await fetchPaged(requestPage);
      if (result.items.isEmpty && requestPage > 1) {
        requestPage -= 1;
        result = await fetchPaged(requestPage);
      }
      _booksFromLocalCacheOnly = false;
      _localCacheLastSyncedAtMs = null;
      _pendingBooksListTimeoutPrompt = false;
      _books = result.items;
      for (final b in _books) {
        _bookDetailOverrides.remove(b.id);
      }
      final observedMin = (result.page - 1) * result.pageSize + result.items.length;
      _total = math.max(result.total, observedMin);
      _page = result.page;
      _pageSize = result.pageSize;
      _ownedBooksPriceStats = await statsFuture;

      if (_searchQuery.isEmpty && _readingStatusFilter == null) {
        final sub = jwtSubjectFromAccessToken(_auth?.session?.accessToken);
        if (sub != null) {
          try {
            await LibraryOfflineStore.upsertBooksDefaultPaperListPage(
              ownerUserId: sub,
              items: result.items,
              serverTotal: result.total,
              page: result.page,
              pageSize: result.pageSize,
            );
          } catch (e, st) {
            debugPrint('LibraryOfflineStore.upsert: $e\n$st');
          }
        }
      }
    } on TimeoutException catch (e) {
      _ownedBooksPriceStats = await statsFuture;
      if (defaultPaperListScope) {
        _pendingBooksListTimeoutPrompt = true;
        _error = null;
        _books = const [];
        _total = 0;
      } else {
        _error =
            '목록을 불러오는 데 시간이 너무 오래 걸립니다. 검색·필터를 끄고 다시 시도하거나 네트워크를 확인해 주세요.';
      }
      debugPrint('LibraryController loadBooksAtPage timeout: $e');
    } catch (error) {
      _error = error.toString();
      _ownedBooksPriceStats = await statsFuture;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadBooks() => loadBooksAtPage(_page);

  /// 타임아웃 안내 후 사용자가 확인했을 때: 기본 종이책 스코프 캐시를 목록에 반영합니다.
  ///
  /// History:
  /// - 2026-04-08: Drift `readDefaultPaperCacheBundle`
  Future<void> applyDefaultPaperListFromLocalCache() async {
    if (!(_auth?.isAuthenticated ?? false)) return;
    final sub = jwtSubjectFromAccessToken(_auth?.session?.accessToken);
    if (sub == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final bundle = await LibraryOfflineStore.readDefaultPaperCacheBundle(sub);
      _booksFromLocalCacheOnly = true;
      _pendingBooksListTimeoutPrompt = false;

      if (bundle.books.isEmpty) {
        _books = const [];
        _total = 0;
        _page = 1;
        _pageSize = defaultPageSize;
        _localCacheLastSyncedAtMs = null;
        _error =
            '이 기기에 저장된 서재 목록이 없습니다. 연결이 될 때 목록을 한 번 불러오면 이후 비슷한 상황에서 사용할 수 있습니다.';
        return;
      }

      _localCacheLastSyncedAtMs = bundle.meta?.lastSyncAtMs;
      _books = List<UserBook>.from(bundle.books);
      for (final b in _books) {
        _bookDetailOverrides.remove(b.id);
      }
      _total = math.max(bundle.books.length, bundle.meta?.serverTotal ?? 0);
      _page = 1;
      _pageSize = math.max(defaultPageSize, bundle.books.length);
    } catch (e, st) {
      _error = '저장된 목록을 읽는 중 오류가 났습니다: $e';
      debugPrint('$st');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

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

  Future<UserBook> updateBook(String id, Map<String, dynamic> payload) async {
    final updated = await _api.updateBook(id, payload);
    _rememberUpdatedBook(updated);
    await loadBooksAtPage(_page);
    _rememberUpdatedBook(updated);
    return updated;
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

  /// 허브 「읽는 중」 카드용. 목록 페이지 상태는 바꾸지 않습니다.
  ///
  /// History:
  /// - 2026-04-02: 종이책(`format=paper`)·읽는 중만 조회
  Future<List<UserBook>> fetchReadingBooksPreview({int limit = 24}) async {
    if (!(_auth?.isAuthenticated ?? false)) return const [];
    final r = await _api.fetchBooksPaged(
      page: 1,
      pageSize: limit.clamp(1, 50),
      readingStatus: 'reading',
      format: 'paper',
    );
    return r.items;
  }
}

