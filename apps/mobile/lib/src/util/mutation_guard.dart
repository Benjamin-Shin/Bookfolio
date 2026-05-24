/// 저장·수정 등 변경 작업의 연타(중복 요청)를 막습니다.
///
/// - [MutationInFlightGuard]: API·컨트롤러 — 동일 키는 진행 중인 [Future]를 공유
/// - [AsyncActionGate]: 화면 — 동일 키의 두 번째 탭은 무시(스낵바·pop 중복 방지)
///
/// @history
/// - 2026-05-24: BookfolioApi·내 서가 저장 UX용 신규
class MutationInFlightGuard {
  final Map<String, Future<dynamic>> _inFlight = {};

  /// 동일 [key] 요청이 이미 있으면 그 [Future]를 반환합니다.
  Future<T> coalesce<T>(String key, Future<T> Function() action) {
    final existing = _inFlight[key];
    if (existing != null) {
      return existing as Future<T>;
    }

    late final Future<T> future;
    future = action();
    future.whenComplete(() {
      if (identical(_inFlight[key], future)) {
        _inFlight.remove(key);
      }
    });
    _inFlight[key] = future;
    return future;
  }
}

/// 화면 단위에서 후속 UI(스낵바·pop)가 두 번 실행되지 않게 합니다.
///
/// @history
/// - 2026-05-24: 기록 수정·책 저장 버튼 연타 방지
class AsyncActionGate {
  final Set<String> _busy = {};

  bool isRunning(String key) => _busy.contains(key);

  /// 이미 실행 중이면 `null`, 아니면 [action] 결과.
  Future<T?> run<T>(String key, Future<T> Function() action) async {
    if (!_busy.add(key)) return null;
    try {
      return await action();
    } finally {
      _busy.remove(key);
    }
  }
}
