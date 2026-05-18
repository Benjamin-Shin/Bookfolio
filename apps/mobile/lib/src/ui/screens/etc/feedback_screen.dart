import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';

/// 의견 보내기 — `POST /api/me/feedback`.
///
/// @history
/// - 2026-05-18: Flutter 웹 — `dart:io` `Platform` 제거, `kIsWeb`·`defaultTargetPlatform`·`webBrowserInfo`
/// - 2026-05-18: 신규 — 햄버거 메뉴 진입
class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key, this.defaultContactEmail});

  final String? defaultContactEmail;

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  static const _kPrimary = Color(0xFF0E6A3C);
  static const _kCardBorder = Color(0xFFE9E3DE);

  final _bodyCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  String _category = 'other';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _emailCtrl.text = widget.defaultContactEmail?.trim() ?? '';
    Future.microtask(_prefillEmail);
  }

  Future<void> _prefillEmail() async {
    if (_emailCtrl.text.isNotEmpty) return;
    try {
      final prof = await context.read<LibraryController>().api.fetchMeProfile();
      if (!mounted || prof.email.trim().isEmpty) return;
      setState(() => _emailCtrl.text = prof.email.trim());
    } catch (_) {}
  }

  @override
  void dispose() {
    _bodyCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _deviceInfo() async {
    final pkg = await PackageInfo.fromPlatform();
    final map = <String, dynamic>{
      'appName': pkg.appName,
      'appVersion': pkg.version,
      'buildNumber': pkg.buildNumber,
      'osName': _osNameLabel(),
    };
    try {
      final plugin = DeviceInfoPlugin();
      if (kIsWeb) {
        final w = await plugin.webBrowserInfo;
        map['browserName'] = w.browserName.name;
        final ua = w.userAgent;
        if (ua != null && ua.isNotEmpty) {
          map['userAgent'] = ua.length > 500 ? '${ua.substring(0, 500)}…' : ua;
        }
        return map;
      }
      if (defaultTargetPlatform == TargetPlatform.android) {
        final a = await plugin.androidInfo;
        map['deviceModel'] = a.model;
        map['deviceManufacturer'] = a.manufacturer;
        map['osVersion'] = a.version.release;
      } else if (defaultTargetPlatform == TargetPlatform.iOS) {
        final i = await plugin.iosInfo;
        map['deviceModel'] = i.utsname.machine;
        map['iosModel'] = i.model;
        map['osVersion'] = i.systemVersion;
      } else {
        map['osVersion'] = defaultTargetPlatform.name;
      }
    } catch (_) {}
    return map;
  }

  String _osNameLabel() {
    if (kIsWeb) return 'web';
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'android';
      case TargetPlatform.iOS:
        return 'ios';
      case TargetPlatform.windows:
        return 'windows';
      case TargetPlatform.macOS:
        return 'macos';
      case TargetPlatform.linux:
        return 'linux';
      case TargetPlatform.fuchsia:
        return 'fuchsia';
    }
  }

  Widget _categoryChip(String value, String label) {
    final selected = _category == value;
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: _saving
          ? null
          : (_) {
              setState(() => _category = value);
            },
    );
  }

  Future<void> _submit() async {
    final body = _bodyCtrl.text.trim();
    if (body.length < 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('의견은 4자 이상 입력해 주세요.')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final api = context.read<LibraryController>().api;
      final pkg = await PackageInfo.fromPlatform();
      await api.submitUserFeedback(
        category: _category,
        body: body,
        contactEmail: _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
        appVersion: pkg.version,
        platform: kIsWeb ? 'web' : 'mobile',
        deviceInfo: await _deviceInfo(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('의견을 보냈습니다. 감사합니다.')),
      );
      Navigator.of(context).pop();
    } on BookfolioApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('의견 보내기')),
      body: ListView(
        padding: bookfolioMobileScrollPadding(context),
        children: [
          Text(
            '버그, 기능 제안, 사용 중 불편한 점을 알려 주세요. 스토어 별점·리뷰와는 별도 채널입니다.',
            style: GoogleFonts.manrope(fontSize: 13, height: 1.45, color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _kCardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('유형', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _categoryChip('bug', '버그·오류'),
                    _categoryChip('idea', '기능 제안'),
                    _categoryChip('other', '기타 의견'),
                  ],
                ),
                const SizedBox(height: 12),
                Text('의견', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                TextField(
                  controller: _bodyCtrl,
                  maxLines: 8,
                  maxLength: 4000,
                  enabled: !_saving,
                  decoration: const InputDecoration(
                    hintText: '불편했던 점, 개선 아이디어, 오류 상황 등',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '회신 이메일 (선택)',
                  style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  enabled: !_saving,
                  decoration: const InputDecoration(
                    hintText: '답변이 필요할 때만 입력',
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _saving ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: _kPrimary,
                    foregroundColor: Colors.white,
                  ),
                  child: Text(_saving ? '보내는 중…' : '의견 보내기'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
