import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/util/bookfolio_web_urls.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// 카메라 런타임 권한 요청 직전, 용도를 짧게 설명하는 전면 화면.
///
/// History:
/// - 2026-04-12: ISBN 바코드 스캔·메모용 OCR 촬영 진입 전 안내, 개인정보처리방침 링크
enum CameraPermissionPurpose {
  /// 도서 등록 등에서 EAN/ISBN 바코드를 스캔할 때.
  isbnBarcodeScan,

  /// 메모 작성 시 책 페이지 촬영 후 기기 내 OCR로 텍스트를 채울 때.
  bookQuoteOcr,
}

/// [CameraPermissionPurpose]별 카피와 「계속」 시 `true`, 취소·뒤로가기 시 `false`로 `pop`합니다.
///
/// History:
/// - 2026-04-12: 신규 — Play 카메라 권한 대응·투명성 안내
class CameraPermissionRationaleScreen extends StatelessWidget {
  const CameraPermissionRationaleScreen({super.key, required this.purpose});

  final CameraPermissionPurpose purpose;

  static String _title(CameraPermissionPurpose p) {
    switch (p) {
      case CameraPermissionPurpose.isbnBarcodeScan:
        return '바코드 스캔';
      case CameraPermissionPurpose.bookQuoteOcr:
        return '촬영으로 글 옮기기';
    }
  }

  static String _lead(CameraPermissionPurpose p) {
    switch (p) {
      case CameraPermissionPurpose.isbnBarcodeScan:
        return '책 뒷면의 ISBN 바코드를 비추어 숫자를 읽습니다. '
            '화면에 보이는 영상은 기기 안에서만 처리되며, 카메라 영상 전체를 서버에 저장하거나 보내지 않습니다. '
            '읽은 ISBN만 도서 정보 조회에 사용됩니다.';
      case CameraPermissionPurpose.bookQuoteOcr:
        return '책 페이지를 한 장 촬영하면, 기기에서 글자만 인식해 메모 입력란에 넣을 수 있습니다. '
            '촬영 이미지는 서버로 올리지 않으며, 인식된 텍스트를 저장할 때만 서비스에 기록됩니다.';
    }
  }

  Future<void> _openPrivacy(BuildContext context) async {
    final uri = bookfolioWebPageUri('/privacy');
    if (!uri.hasScheme || uri.host.isEmpty) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('서가담 웹 주소가 설정되지 않았습니다.')),
        );
      }
      return;
    }
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('브라우저를 열 수 없습니다.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text(_title(purpose)),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Icon(
                        Icons.photo_camera_outlined,
                        size: 48,
                        color: BookfolioDesignTokens.primary.withValues(alpha: 0.85),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        '카메라가 필요한 이유',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: BookfolioDesignTokens.onSurface,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _lead(purpose),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              height: 1.45,
                              color: scheme.onSurface.withValues(alpha: 0.88),
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '다음 화면에서 OS가 카메라 사용 허용을 물을 수 있습니다. 거부하면 해당 기능만 이용할 수 없습니다.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              height: 1.4,
                              color: BookfolioDesignTokens.onSurfaceVariant,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
              TextButton(
                onPressed: () => _openPrivacy(context),
                child: const Text('개인정보처리방침에서 자세히 보기'),
              ),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(true),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: BookfolioDesignTokens.primary,
                  foregroundColor: BookfolioDesignTokens.onPrimary,
                ),
                child: const Text('계속'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('취소'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
