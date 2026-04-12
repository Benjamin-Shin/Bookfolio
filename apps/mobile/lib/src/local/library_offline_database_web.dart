import 'package:drift/drift.dart';
import 'package:drift/wasm.dart';
import 'package:flutter/foundation.dart';

/// Flutter 웹: Drift WASM + 워커(`web/sqlite3.wasm`, `web/drift_worker.js`).
///
/// @history
/// - 2026-04-11: 웹 빌드 시 `dart:ffi`/sqlite3 네이티브 바인딩 제외
LazyDatabase createLibraryOfflineLazyDatabase() {
  return LazyDatabase(() async {
    final result = await WasmDatabase.open(
      databaseName: 'bookfolio_offline',
      sqlite3Uri: Uri.parse('sqlite3.wasm'),
      driftWorkerUri: Uri.parse('drift_worker.js'),
    );
    if (result.missingFeatures.isNotEmpty && kDebugMode) {
      debugPrint(
        'LibraryOfflineDatabase (web): storage=${result.chosenImplementation}, '
        'missingFeatures=${result.missingFeatures}',
      );
    }
    return result.resolvedExecutor;
  });
}
