import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/ui/app_root_scaffold.dart';

/// 서버 `POST /api/client-errors`로 모바일 오류를 **사용자 동의 후** 전송합니다.
///
/// History:
/// - 2026-05-03: 확인 다이얼로그 후 전송 — 자동 전송 제거
/// - 2026-05-03: 신규 — 전역 핸들러·환경 context·선택 Bearer
class BookfolioClientErrorReporter {
  BookfolioClientErrorReporter._();

  static final BookfolioClientErrorReporter instance =
      BookfolioClientErrorReporter._();

  static const _apiBase = String.fromEnvironment('BOOKFOLIO_API_BASE_URL');
  static const _maxMessageChars = 1900;
  static const _maxStackChars = 6000;

  final http.Client _http = http.Client();
  AuthController? _auth;
  Map<String, dynamic>? _cachedEnv;
  bool _handlersInstalled = false;
  bool _dialogShowing = false;

  /// [AuthController]를 연결하면 보고 시 `Authorization: Bearer`가 붙어 `user_id`가 저장될 수 있습니다.
  ///
  /// History:
  /// - 2026-05-03: 신규
  void attachAuth(AuthController auth) {
    _auth = auth;
  }

  /// `FlutterError.onError`·`PlatformDispatcher.instance.onError`를 한 번만 설치합니다.
  ///
  /// History:
  /// - 2026-05-03: 신규
  void installGlobalHandlers() {
    if (_handlersInstalled) {
      return;
    }
    _handlersInstalled = true;

    final previousFlutterOnError = FlutterError.onError;
    FlutterError.onError = (FlutterErrorDetails details) {
      previousFlutterOnError?.call(details);
      unawaited(reportFlutterError(details));
    };

    final previousPlatformOnError = PlatformDispatcher.instance.onError;
    PlatformDispatcher.instance.onError = (Object error, StackTrace stack) {
      unawaited(reportAsyncError(error, stack));
      return previousPlatformOnError?.call(error, stack) ?? false;
    };
  }

  /// 위젯 프레임워크 오류 1건 — **전송 확인** 후 서버로 보냅니다.
  ///
  /// History:
  /// - 2026-05-03: 확인 다이얼로그 경유
  /// - 2026-05-03: 신규
  Future<void> reportFlutterError(FlutterErrorDetails details) async {
    final buffer = StringBuffer();
    buffer.writeln(details.exceptionAsString());
    if (details.library != null) {
      buffer.writeln('library: ${details.library}');
    }
    if (details.context != null) {
      buffer.writeln('context: ${details.context}');
    }
    final stack = details.stack?.toString();
    await _offerReport(
      kind: 'flutter_error',
      message: buffer.toString(),
      stackTrace: stack,
    );
  }

  /// 존/비동기에서 잡히지 않은 오류 — **전송 확인** 후 서버로 보냅니다.
  ///
  /// History:
  /// - 2026-05-03: 확인 다이얼로그 경유
  /// - 2026-05-03: 신규
  Future<void> reportAsyncError(Object error, StackTrace stack) async {
    await _offerReport(
      kind: 'zone_async',
      message: error.toString(),
      stackTrace: stack.toString(),
    );
  }

  Future<void> _offerReport({
    required String kind,
    required String message,
    String? stackTrace,
  }) async {
    final base = _apiBase.trim();
    if (base.isEmpty) {
      if (kDebugMode) {
        debugPrint(
            'BookfolioClientErrorReporter: BOOKFOLIO_API_BASE_URL 비어 있음 — 안내 생략');
      }
      return;
    }

    if (_dialogShowing) {
      if (kDebugMode) {
        debugPrint(
            'BookfolioClientErrorReporter: 이미 확인 창 표시 중 — 건너뜀 ($kind)');
      }
      return;
    }

    for (var attempt = 0; attempt < 40; attempt++) {
      final ctx = bookfolioRootNavigatorKey.currentContext;
      if (ctx != null && ctx.mounted) {
        await _showSendConfirmDialog(
          ctx,
          kind: kind,
          message: message,
          stackTrace: stackTrace,
        );
        return;
      }
      await WidgetsBinding.instance.endOfFrame;
      await Future<void>.delayed(const Duration(milliseconds: 16));
    }
    if (kDebugMode) {
      debugPrint(
          'BookfolioClientErrorReporter: Navigator context 없음 — 확인 창 미표시 ($kind)');
    }
  }

  Future<void> _showSendConfirmDialog(
    BuildContext dialogContext, {
    required String kind,
    required String message,
    String? stackTrace,
  }) async {
    if (_dialogShowing) {
      return;
    }
    _dialogShowing = true;
    try {
      final agreed = await showDialog<bool>(
        context: dialogContext,
        useRootNavigator: true,
        barrierDismissible: true,
        builder: (ctx) {
          return AlertDialog(
            title: const Text('오류가 발생했습니다'),
            content: SingleChildScrollView(
              child: Text(
                '진단에 도움이 되는 정보(오류 요약, 기기·OS, 앱 버전 등)를 서버로 보내시겠습니까?\n\n'
                '보내지 않으면 전송되지 않습니다.',
                style: Theme.of(ctx).textTheme.bodyMedium,
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('보내지 않음'),
              ),
              FilledButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('보내기'),
              ),
            ],
          );
        },
      );
      if (agreed != true) {
        return;
      }
      final ok = await _post(
        kind: kind,
        message: message,
        stackTrace: stackTrace,
      );
      _snack(ok
          ? '진단 정보를 보냈습니다.'
          : '전송에 실패했습니다. 네트워크를 확인해 주세요.');
    } finally {
      _dialogShowing = false;
    }
  }

  void _snack(String text) {
    final messenger = bookfolioRootScaffoldMessengerKey.currentState;
    messenger?.showSnackBar(SnackBar(content: Text(text)));
  }

  Future<Map<String, dynamic>> _deviceEnv() async {
    if (_cachedEnv != null) {
      return _cachedEnv!;
    }
    final pkg = await PackageInfo.fromPlatform();
    final locale = PlatformDispatcher.instance.locale;
    final map = <String, dynamic>{
      'appName': pkg.appName,
      'appVersion': pkg.version,
      'buildNumber': pkg.buildNumber,
      'osName': Platform.operatingSystem,
      'osVersion': Platform.operatingSystemVersion,
      'locale': locale.toLanguageTag(),
    };

    try {
      final plugin = DeviceInfoPlugin();
      if (Platform.isAndroid) {
        final a = await plugin.androidInfo;
        map['deviceModel'] = a.model;
        map['deviceManufacturer'] = a.manufacturer;
        map['deviceBrand'] = a.brand;
        map['sdkInt'] = a.version.sdkInt;
      } else if (Platform.isIOS) {
        final i = await plugin.iosInfo;
        map['deviceModel'] = i.utsname.machine;
        map['iosModel'] = i.model;
        map['systemName'] = i.systemName;
        map['systemVersion'] = i.systemVersion;
      }
    } catch (e) {
      map['deviceInfoError'] = e.toString();
    }

    _cachedEnv = map;
    return map;
  }

  /// 서버로 1건 전송. HTTP 2xx이면 `true`.
  ///
  /// History:
  /// - 2026-05-03: 성공 여부 반환 — 스낵바용
  Future<bool> _post({
    required String kind,
    required String message,
    String? stackTrace,
  }) async {
    final base = _apiBase.trim();
    if (base.isEmpty) {
      return false;
    }

    try {
      final env = await _deviceEnv();
      final ctx = <String, dynamic>{
        ...env,
        if (stackTrace != null && stackTrace.isNotEmpty)
          'stack': stackTrace.length > _maxStackChars
              ? '${stackTrace.substring(0, _maxStackChars)}…[truncated]'
              : stackTrace,
      };

      var msg = message.trim();
      if (msg.length > _maxMessageChars) {
        msg = '${msg.substring(0, _maxMessageChars)}…[truncated]';
      }

      final uri = Uri.parse(
          '${base.replaceAll(RegExp(r'/+$'), '')}/api/client-errors');
      final headers = <String, String>{
        'Content-Type': 'application/json; charset=utf-8',
      };
      final token = _auth?.session?.accessToken;
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      final body = jsonEncode({
        'platform': 'mobile',
        'kind': kind,
        'message': msg,
        'context': ctx,
      });

      final response =
          await _http.post(uri, headers: headers, body: body).timeout(
                const Duration(seconds: 12),
              );
      if (kDebugMode && response.statusCode >= 400) {
        debugPrint(
            'BookfolioClientErrorReporter: HTTP ${response.statusCode} ${response.body}');
      }
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('BookfolioClientErrorReporter: 전송 실패 $e $st');
      }
      return false;
    }
  }
}
