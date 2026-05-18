import 'package:seogadam_mobile/src/app.dart';
import 'package:seogadam_mobile/src/local/library_offline_store.dart';
import 'package:seogadam_mobile/src/services/bookfolio_client_error_reporter.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:kakao_flutter_sdk_user/kakao_flutter_sdk_user.dart';

/// History:
/// - 2026-05-19: `SystemChrome.setPreferredOrientations` — 세로(포트레이트)만 허용 (Nox·가로 에뮬 UI 대응)
/// - 2026-05-03: `BookfolioClientErrorReporter.installGlobalHandlers` — 서버 `/api/client-errors`
/// - 2026-04-24: 카카오 SDK 초기화(`KAKAO_NATIVE_APP_KEY`) 추가
/// - 2026-04-03: `table_calendar` 한국어(`ko_KR`)용 `initializeDateFormatting`
/// - 2026-04-08: Drift 오프라인 DB 연결 준비(`LibraryOfflineStore`)
Future<void> main() async {
  const kakaoNativeAppKey = String.fromEnvironment('KAKAO_NATIVE_APP_KEY');
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  BookfolioClientErrorReporter.instance.installGlobalHandlers();
  if (kakaoNativeAppKey.trim().isNotEmpty) {
    KakaoSdk.init(nativeAppKey: kakaoNativeAppKey.trim());
  }
  await initializeDateFormatting('ko_KR');
  LibraryOfflineStore.ensureInitialized();
  runApp(const BookfolioApp());
}
