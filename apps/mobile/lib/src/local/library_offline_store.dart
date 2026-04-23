import 'dart:convert';

import 'package:seogadam_mobile/src/local/library_offline_database.dart';
import 'package:seogadam_mobile/src/models/book_models.dart';
import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';

/// Drift DB 싱글톤 — 서가 목록 미러·아웃박스(후속).
///
/// @history
/// - 2026-04-12: `clearLibraryMirror` 문서 — 예약된 작업 메모 표기 제거(도구·lint 오탐 방지)
/// - 2026-04-08: 기본 종이책 목록(필터 없음) 수신 시 캐시; 로그아웃 시 미러만 삭제·아웃박스 유지
/// - 2026-04-08: `readDefaultPaperCacheMeta`·`readDefaultPaperCacheBundle`·타임아웃 폴백 UI
class LibraryOfflineStore {
  LibraryOfflineStore._();

  static LibraryOfflineDatabase? _db;

  /// `main`에서 앱 기동 시 1회 호출.
  static void ensureInitialized() {
    _db ??= LibraryOfflineDatabase.connect();
  }

  static LibraryOfflineDatabase get _requireDb {
    final d = _db;
    if (d == null) {
      throw StateError(
          'LibraryOfflineStore.ensureInitialized() was not called');
    }
    return d;
  }

  /// 검색·읽기상태 필터가 없는 종이책 목록과 동일 스코프.
  static const defaultPaperListScope = 'default_paper';

  /// `readDefaultPaperCacheBundle`용 메타.
  ///
  /// @history
  /// - 2026-04-08: 타임아웃 후 로컬 목록 표시 시 total·동기 시각
  static Future<DefaultPaperCacheMeta?> readDefaultPaperCacheMeta(
      String ownerUserId) async {
    final db = _requireDb;
    final row = await (db.select(db.libraryCacheMeta)
          ..where(
            (t) =>
                t.ownerUserId.equals(ownerUserId) &
                t.scopeKey.equals(defaultPaperListScope),
          ))
        .getSingleOrNull();
    if (row == null) return null;
    return DefaultPaperCacheMeta(
      serverTotal: row.serverTotal,
      lastSyncAtMs: row.lastSyncAtMs,
      lastServerPage: row.lastServerPage,
      lastPageSize: row.lastPageSize,
    );
  }

  /// 캐시된 행 + 메타를 한 번에(오프라인 폴백 UI).
  ///
  /// @history
  /// - 2026-04-08: 추가
  static Future<DefaultPaperCacheBundle> readDefaultPaperCacheBundle(
      String ownerUserId) async {
    final books = await readCachedDefaultPaperList(ownerUserId);
    final meta = await readDefaultPaperCacheMeta(ownerUserId);
    return DefaultPaperCacheBundle(books: books, meta: meta);
  }

  /// 네트워크에서 받은 한 페이지를 미러에 반영합니다(upsert).
  static Future<void> upsertBooksDefaultPaperListPage({
    required String ownerUserId,
    required List<UserBook> items,
    required int serverTotal,
    required int page,
    required int pageSize,
  }) async {
    final db = _requireDb;
    final now = DateTime.now().millisecondsSinceEpoch;
    await db.batch((b) {
      for (final book in items) {
        b.insert(
          db.cachedUserBooks,
          CachedUserBooksCompanion(
            ownerUserId: Value(ownerUserId),
            userBookId: Value(book.id),
            payloadJson: Value(jsonEncode(book.toJson())),
            cachedAtMs: Value(now),
          ),
          mode: InsertMode.insertOrReplace,
        );
      }
    });
    await db.into(db.libraryCacheMeta).insertOnConflictUpdate(
          LibraryCacheMetaCompanion(
            ownerUserId: Value(ownerUserId),
            scopeKey: Value(defaultPaperListScope),
            lastSyncAtMs: Value(now),
            serverTotal: Value(serverTotal),
            lastServerPage: Value(page),
            lastPageSize: Value(pageSize),
          ),
        );
  }

  /// 로그아웃 시: 캐시 메타·미러 행만 제거합니다. 동기 아웃박스 테이블은 삭제하지 않습니다(후속 정책에서 비울지 등 결정).
  static Future<void> clearLibraryMirror() async {
    final db = _requireDb;
    await db.delete(db.cachedUserBooks).go();
    await db.delete(db.libraryCacheMeta).go();
  }

  /// 오프라인 UI(후속)용: 기본 스코프에 캐시된 책 목록.
  static Future<List<UserBook>> readCachedDefaultPaperList(
      String ownerUserId) async {
    final db = _requireDb;
    final rows = await (db.select(db.cachedUserBooks)
          ..where((t) => t.ownerUserId.equals(ownerUserId))
          ..orderBy([(t) => OrderingTerm(expression: t.userBookId)]))
        .get();
    final out = <UserBook>[];
    for (final r in rows) {
      try {
        final map = jsonDecode(r.payloadJson) as Map<String, dynamic>;
        out.add(UserBook.fromJson(map));
      } catch (e, st) {
        debugPrint(
            'LibraryOfflineStore: skip bad cache row ${r.userBookId}: $e\n$st');
      }
    }
    return out;
  }

  static Future<int> pendingOutboxCount() async {
    final db = _requireDb;
    final rows = await (db.select(db.syncOutboxEntries)
          ..where((t) => t.status.equals('pending')))
        .get();
    return rows.length;
  }
}

/// `library_cache_meta` 한 행 요약.
///
/// @history
/// - 2026-04-08: 오프라인 목록 폴백
class DefaultPaperCacheMeta {
  const DefaultPaperCacheMeta({
    this.serverTotal,
    required this.lastSyncAtMs,
    this.lastServerPage,
    this.lastPageSize,
  });

  final int? serverTotal;
  final int lastSyncAtMs;
  final int? lastServerPage;
  final int? lastPageSize;
}

/// 로컬에 남아 있는 기본 종이책 목록 + 메타.
///
/// @history
/// - 2026-04-08: 추가
class DefaultPaperCacheBundle {
  const DefaultPaperCacheBundle({required this.books, this.meta});

  final List<UserBook> books;
  final DefaultPaperCacheMeta? meta;
}
