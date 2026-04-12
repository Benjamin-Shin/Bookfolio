import 'package:seogadam_mobile/src/app.dart';
import 'package:seogadam_mobile/src/local/library_offline_store.dart';
import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';

/// History:
/// - 2026-04-03: `table_calendar` 한국어(`ko_KR`)용 `initializeDateFormatting`
/// - 2026-04-08: Drift 오프라인 DB 연결 준비(`LibraryOfflineStore`)
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('ko_KR');
  LibraryOfflineStore.ensureInitialized();
  runApp(const BookfolioApp());
}
