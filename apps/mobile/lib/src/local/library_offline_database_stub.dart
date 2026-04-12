import 'package:drift/drift.dart';

/// 이 플랫폼에서는 오프라인 Drift를 지원하지 않습니다.
///
/// @history
/// - 2026-04-11: 웹·네이티브 분리용 스텁
LazyDatabase createLibraryOfflineLazyDatabase() {
  throw UnsupportedError(
    'Library offline database is not supported on this platform.',
  );
}
