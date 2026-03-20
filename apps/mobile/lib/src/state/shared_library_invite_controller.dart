import 'dart:async';
import 'dart:convert';

import 'package:bookfolio_mobile/src/models/shared_library_models.dart';
import 'package:bookfolio_mobile/src/services/bookfolio_api.dart';
import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/ui/app_root_scaffold.dart';
import 'package:bookfolio_mobile/src/ui/screens/shared_library_books_screen.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 공동서재 초대를 **앱이 포그라운드일 때만** 폴링으로 감지하고 SnackBar로 알립니다.
///
/// @history 2026-03-20 MVP: FCM 없이 `/api/me/libraries` 스냅샷 diff + SharedPreferences.
class SharedLibraryInviteController extends ChangeNotifier {
  SharedLibraryInviteController();

  static const _knownIdsKey = 'bookfolio_known_shared_library_ids';

  final BookfolioApi _api = BookfolioApi();
  AuthController? _auth;
  String? _lastToken;

  Timer? _timer;
  bool _foreground = false;
  bool _pollInFlight = false;

  static const _pollInterval = Duration(seconds: 45);

  void attach(AuthController auth) {
    _api.accessToken = () => auth.session?.accessToken;
    final token = auth.session?.accessToken;
    final tokenChanged = token != _lastToken;
    _auth = auth;
    _lastToken = token;

    if (!auth.isAuthenticated) {
      _stopPolling();
      unawaited(_clearKnownIds());
      return;
    }

    if (tokenChanged) {
      unawaited(_poll(isLoginContext: true));
    }
  }

  /// [SharedLibraryInviteLifecycle]에서 앱이 앞으로 나올 때 호출.
  void onForeground() {
    _foreground = true;
    if (!(_auth?.isAuthenticated ?? false)) return;
    unawaited(_poll());
    _startPolling();
  }

  /// 앱이 백그라운드로 갈 때 호출.
  void onBackground() {
    _foreground = false;
    _stopPolling();
  }

  void _startPolling() {
    _timer?.cancel();
    if (!(_auth?.isAuthenticated ?? false)) return;
    _timer = Timer.periodic(_pollInterval, (_) {
      if (_foreground) {
        unawaited(_poll());
      }
    });
  }

  void _stopPolling() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  void dispose() {
    _stopPolling();
    super.dispose();
  }

  Future<void> _clearKnownIds() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_knownIdsKey);
  }

  Future<void> _poll({bool isLoginContext = false}) async {
    if (_pollInFlight) return;
    if (!(_auth?.isAuthenticated ?? false)) return;

    _pollInFlight = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      final rawKnown = prefs.getString(_knownIdsKey);
      final isFirstBaseline = rawKnown == null;

      final List<SharedLibrarySummary> list;
      try {
        list = await _api.fetchSharedLibraries();
      } catch (e) {
        if (kDebugMode) {
          debugPrint('[shared_invite] poll failed: $e');
        }
        return;
      }

      final currentIds = list.map((e) => e.id).toSet();
      final idToName = {for (final e in list) e.id: e.name};

      if (isFirstBaseline) {
        await _saveKnownIds(prefs, currentIds);
        if (kDebugMode && isLoginContext) {
          debugPrint('[shared_invite] baseline ${currentIds.length} libraries');
        }
        return;
      }

      Set<String> known;
      try {
        final decoded = jsonDecode(rawKnown) as List<dynamic>;
        known = decoded.map((e) => e as String).toSet();
      } catch (_) {
        await _saveKnownIds(prefs, currentIds);
        return;
      }
      final newIds = currentIds.difference(known);

      await _saveKnownIds(prefs, currentIds);

      if (newIds.isEmpty) return;

      if (kDebugMode) {
        debugPrint('[shared_invite] new libraries: $newIds');
      }
      _showInviteSnackBar(newIds, idToName);
    } finally {
      _pollInFlight = false;
    }
  }

  Future<void> _saveKnownIds(SharedPreferences prefs, Set<String> ids) async {
    await prefs.setString(_knownIdsKey, jsonEncode(ids.toList()..sort()));
  }

  void _showInviteSnackBar(Set<String> newIds, Map<String, String> idToName) {
    final names = newIds.map((id) => idToName[id] ?? '서재').toList();
    final message = _formatInviteMessage(names);

    final messenger = bookfolioRootScaffoldMessengerKey.currentState;
    if (messenger == null) return;

    final firstId = newIds.first;
    final firstName = idToName[firstId] ?? '공동서재';

    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 6),
        action: SnackBarAction(
          label: '보기',
          onPressed: () => _openSharedLibrary(firstId, firstName),
        ),
      ),
    );
  }

  String _formatInviteMessage(List<String> names) {
    if (names.length == 1) {
      return '「${names[0]}」 공동서재에 초대되었습니다.';
    }
    if (names.length == 2) {
      return '「${names[0]}」, 「${names[1]}」 공동서재에 초대되었습니다.';
    }
    return '「${names[0]}」 외 ${names.length - 1}곳의 공동서재에 초대되었습니다.';
  }

  void _openSharedLibrary(String libraryId, String libraryName) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      bookfolioRootNavigatorKey.currentState?.push(
        MaterialPageRoute<void>(
          builder: (_) => SharedLibraryBooksScreen(
            libraryId: libraryId,
            libraryName: libraryName,
          ),
        ),
      );
    });
  }
}
