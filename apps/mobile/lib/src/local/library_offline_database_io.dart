import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

/// 네이티브(모바일·데스크톱)에서 SQLite 파일로 Drift 연결.
///
/// @history
/// - 2026-04-11: `library_offline_database.dart`에서 분리(웹에서 ffi 미포함)
LazyDatabase createLibraryOfflineLazyDatabase() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'bookfolio_offline.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
