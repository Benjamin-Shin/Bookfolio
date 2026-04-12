import 'package:seogadam_mobile/src/local/library_offline_database_connection.dart';
import 'package:drift/drift.dart';

part 'library_offline_database.g.dart';

/// JWT `sub`(또는 동등 주체 ID)별로 마지막으로 받은 목록 행을 JSON으로 보관합니다.
///
/// @history
/// - 2026-04-08: 오프라인 동기 1차 — 기본 종이책 목록 미러
class CachedUserBooks extends Table {
  TextColumn get ownerUserId => text()();
  TextColumn get userBookId => text()();
  TextColumn get payloadJson => text()();
  IntColumn get cachedAtMs => integer()();

  @override
  Set<Column<Object>> get primaryKey => {ownerUserId, userBookId};
}

/// 목록 스코프별 마지막 동기 시각·서버 total 등(UI·후속 전체 동기용).
///
/// @history
/// - 2026-04-08: `default_paper` 스코프 메타
class LibraryCacheMeta extends Table {
  TextColumn get ownerUserId => text()();
  TextColumn get scopeKey => text()();
  IntColumn get lastSyncAtMs => integer()();
  IntColumn get serverTotal => integer().nullable()();
  IntColumn get lastServerPage => integer().nullable()();
  IntColumn get lastPageSize => integer().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {ownerUserId, scopeKey};
}

/// 오프라인에서 적용한 변경을 올릴 때 사용(배치 POST 전 단계).
///
/// @history
/// - 2026-04-08: 스키마만 추가, 큐 적재·플러시는 후속
class SyncOutboxEntries extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get ownerUserId => text()();
  TextColumn get operation => text()();
  TextColumn get payloadJson => text()();
  TextColumn get clientMutationId => text().unique()();
  TextColumn get status => text().withDefault(const Constant('pending'))();
  IntColumn get createdAtMs => integer()();
}

/// 서가담 모바일 오프라인 캐시·아웃박스 DB.
///
/// @history
/// - 2026-04-11: 네이티브 FFI는 `library_offline_database_io.dart`, 웹은 WASM(`library_offline_database_web.dart`)로 분리
/// - 2026-04-08: 초기 스키마(v1)
@DriftDatabase(tables: [CachedUserBooks, LibraryCacheMeta, SyncOutboxEntries])
class LibraryOfflineDatabase extends _$LibraryOfflineDatabase {
  LibraryOfflineDatabase(super.e);

  @override
  int get schemaVersion => 1;

  /// 앱 프로세스당 하나의 연결.
  ///
  /// @history
  /// - 2026-04-11: `createLibraryOfflineLazyDatabase()` 조건부 구현(웹·네이티브)
  /// - 2026-04-08: 문서 디렉터리에 단일 파일
  factory LibraryOfflineDatabase.connect() {
    return LibraryOfflineDatabase(createLibraryOfflineLazyDatabase());
  }
}
