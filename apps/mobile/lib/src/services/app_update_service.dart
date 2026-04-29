import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:in_app_update/in_app_update.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

/// 앱 실행 시 스토어 업데이트 가능 여부를 확인한다.
///
/// @history
/// - 2026-04-29: Android In-App Update 자동 체크와 iOS App Store 안내 다이얼로그를 추가했다.
class AppUpdateService {
  AppUpdateService._();

  static final AppUpdateService instance = AppUpdateService._();

  bool _didCheckOnLaunch = false;

  Future<void> checkForUpdateOnLaunch(BuildContext context) async {
    if (_didCheckOnLaunch) return;
    _didCheckOnLaunch = true;

    if (Platform.isAndroid) {
      await _checkAndroidInAppUpdate();
      return;
    }

    if (Platform.isIOS) {
      await _checkIosAppStoreUpdate(context);
    }
  }

  Future<void> _checkAndroidInAppUpdate() async {
    try {
      final info = await InAppUpdate.checkForUpdate();
      if (info.updateAvailability != UpdateAvailability.updateAvailable) {
        return;
      }
      if (info.immediateUpdateAllowed) {
        await InAppUpdate.performImmediateUpdate();
        return;
      }
      if (info.flexibleUpdateAllowed) {
        await InAppUpdate.startFlexibleUpdate();
        await InAppUpdate.completeFlexibleUpdate();
      }
    } catch (_) {
      // 업데이트 확인 실패는 앱 사용을 막지 않는다.
    }
  }

  Future<void> _checkIosAppStoreUpdate(BuildContext context) async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final bundleId = packageInfo.packageName.trim();
      if (bundleId.isEmpty) return;

      final uri = Uri.https('itunes.apple.com', '/lookup', <String, String>{
        'bundleId': bundleId,
        'country': 'kr',
      });
      final response = await http.get(uri);
      if (response.statusCode != 200) return;

      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic>) return;
      final results = decoded['results'];
      if (results is! List || results.isEmpty) return;

      final first = results.first;
      if (first is! Map) return;

      final storeVersion = (first['version'] as String?)?.trim();
      final trackViewUrl = (first['trackViewUrl'] as String?)?.trim();
      final localVersion = packageInfo.version.trim();
      if (storeVersion == null ||
          storeVersion.isEmpty ||
          localVersion.isEmpty) {
        return;
      }
      if (!_isStoreVersionNewer(storeVersion, localVersion)) return;
      if (!context.mounted) return;

      await _showIosUpdateDialog(context, trackViewUrl);
    } catch (_) {
      // 업데이트 확인 실패는 앱 사용을 막지 않는다.
    }
  }

  Future<void> _showIosUpdateDialog(
    BuildContext context,
    String? trackViewUrl,
  ) async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('새 버전이 있습니다'),
          content: const Text('더 나은 사용 경험을 위해 앱을 업데이트해 주세요.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('나중에'),
            ),
            FilledButton(
              onPressed: () async {
                Navigator.of(dialogContext).pop();
                if (trackViewUrl == null || trackViewUrl.isEmpty) return;
                final uri = Uri.tryParse(trackViewUrl);
                if (uri == null) return;
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              },
              child: const Text('업데이트'),
            ),
          ],
        );
      },
    );
  }

  bool _isStoreVersionNewer(String storeVersion, String localVersion) {
    final store = _normalizeVersion(storeVersion);
    final local = _normalizeVersion(localVersion);
    final length = store.length > local.length ? store.length : local.length;
    for (var i = 0; i < length; i++) {
      final a = i < store.length ? store[i] : 0;
      final b = i < local.length ? local[i] : 0;
      if (a > b) return true;
      if (a < b) return false;
    }
    return false;
  }

  List<int> _normalizeVersion(String version) {
    return version
        .split('.')
        .map(
            (part) => int.tryParse(part.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0)
        .toList();
  }
}
