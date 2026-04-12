/// 플랫폼별 Drift `LazyDatabase` 팩토리.
///
/// [Drift 웹 가이드](https://drift.simonbinder.eu/web)와 동일한 조건부 export 순서를 따릅니다.
///
/// @history
/// - 2026-04-12: 무이름 `library;` 지시어 — 상단 `///` 라이브러리 문서·이름 불필요 lint
/// - 2026-04-11: 웹(js_interop) / 네이티브(ffi) 분리
library;

export 'library_offline_database_stub.dart'
    if (dart.library.js_interop) 'library_offline_database_web.dart'
    if (dart.library.ffi) 'library_offline_database_io.dart';
