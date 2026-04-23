import 'package:seogadam_mobile/src/state/connectivity_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

/// 네트워크가 끊긴 동안 자식 대신 오프라인 안내를 표시합니다.
///
/// History:
/// - 2026-04-06: Stitch1 네트워크 필수 진입점 가드 — 로그인·메인 쉘 루트
class NetworkGate extends StatelessWidget {
  const NetworkGate({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Consumer<ConnectivityController>(
      builder: (context, connectivity, _) {
        if (!connectivity.isOnline) {
          return OfflineMessageScreen(onRetry: () => connectivity.recheck());
        }
        return child;
      },
    );
  }
}

/// 공통 오프라인 메시지(전면 또는 루트 교체용).
///
/// History:
/// - 2026-04-06: 신규
class OfflineMessageScreen extends StatelessWidget {
  const OfflineMessageScreen({super.key, required this.onRetry});

  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(
                Icons.wifi_off_rounded,
                size: 56,
                color: BookfolioDesignTokens.onSurfaceVariant
                    .withValues(alpha: 0.75),
              ),
              const SizedBox(height: 24),
              Text(
                '인터넷 연결이 필요합니다',
                textAlign: TextAlign.center,
                style: BookfolioDesignTokens.headlineMd(
                        BookfolioDesignTokens.primary,
                        fontStyle: FontStyle.normal)
                    .copyWith(fontSize: 22),
              ),
              const SizedBox(height: 12),
              Text(
                '서가담은 개인 서가와 목록을 서버와 동기화합니다.\n와이파이 또는 모바일 데이터를 켠 뒤 다시 시도해 주세요.',
                textAlign: TextAlign.center,
                style: GoogleFonts.manrope(
                  fontSize: 14,
                  height: 1.45,
                  color: BookfolioDesignTokens.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 32),
              FilledButton(
                onPressed: () => onRetry(),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: scheme.primary,
                  foregroundColor: scheme.onPrimary,
                ),
                child: Text(
                  '연결 상태 다시 확인',
                  style: GoogleFonts.manrope(
                      fontWeight: FontWeight.w700, fontSize: 15),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
