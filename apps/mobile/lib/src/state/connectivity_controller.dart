import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// 단말 네트워크 인터페이스 연결 여부(와이파이·셀룰러 등). 실제 인터넷 도달은 보장하지 않습니다.
///
/// History:
/// - 2026-04-06: `connectivity_plus` — 오프라인 가드·재시도용
class ConnectivityController extends ChangeNotifier {
  ConnectivityController() {
    _init();
  }

  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  List<ConnectivityResult> _results = const [];

  /// `none`만 있거나 목록이 비면 오프라인으로 본다.
  bool get isOnline {
    if (_results.isEmpty) return false;
    return _results.any((r) => r != ConnectivityResult.none);
  }

  Future<void> _init() async {
    try {
      _results = await _connectivity.checkConnectivity();
    } catch (_) {
      _results = const [ConnectivityResult.none];
    }
    notifyListeners();
    _subscription = _connectivity.onConnectivityChanged.listen((r) {
      _results = r;
      notifyListeners();
    });
  }

  /// 사용자가 「다시 시도」할 때 호출.
  Future<void> recheck() async {
    try {
      _results = await _connectivity.checkConnectivity();
    } catch (_) {
      _results = const [ConnectivityResult.none];
    }
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
