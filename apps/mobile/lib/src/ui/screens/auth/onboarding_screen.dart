import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

/// 회원가입 후 1회 온보딩(바코드·등록 안내). `reviewOnly`면 정보용으로만 표시.
///
/// History:
/// - 2026-04-06: `onboardingCompleted` API·프로필 `onboarding_completed_at` 연동
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({
    super.key,
    this.reviewOnly = false,
    this.onCompleted,
  });

  /// `true`이면 완료 API를 호출하지 않고 닫기만(프로필 「가이드 다시 보기」).
  final bool reviewOnly;

  /// 차단 온보딩에서 완료/건너뛰기 후 프로필 다시 로드 등.
  final VoidCallback? onCompleted;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _page = 0;
  static const _totalPages = 3;
  bool _submitting = false;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    if (widget.reviewOnly) {
      if (mounted) Navigator.of(context).pop();
      return;
    }
    if (_submitting) return;
    setState(() => _submitting = true);
    try {
      await context
          .read<LibraryController>()
          .api
          .updateMeProfile({'onboardingCompleted': true});
      if (!mounted) return;
      widget.onCompleted?.call();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('저장에 실패했습니다. $e')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _next() {
    if (_page < _totalPages - 1) {
      _pageController.nextPage(
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOutCubic);
    } else {
      _finish();
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: BookfolioDesignTokens.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: widget.reviewOnly
            ? IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).pop(),
              )
            : null,
        automaticallyImplyLeading: false,
        actions: [
          if (!widget.reviewOnly)
            TextButton(
              onPressed: _submitting ? null : _finish,
              child: Text(
                '건너뛰기',
                style: GoogleFonts.manrope(
                  fontWeight: FontWeight.w600,
                  color: BookfolioDesignTokens.onSurfaceVariant,
                ),
              ),
            ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
            child: Row(
              children: List.generate(_totalPages, (i) {
                final on = i <= _page;
                return Expanded(
                  child: Padding(
                    padding:
                        EdgeInsets.only(right: i == _totalPages - 1 ? 0 : 6),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      height: 3,
                      decoration: BoxDecoration(
                        color: on
                            ? BookfolioDesignTokens.primary
                            : BookfolioDesignTokens.outlineVariant
                                .withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              onPageChanged: (i) => setState(() => _page = i),
              children: [
                _OnboardingPage(
                  icon: Icons.menu_book_rounded,
                  title: '서가담에 오신 것을 환영합니다',
                  body:
                      '개인 서가에 책을 등록하고, 읽기 상태와 기록을 남길 수 있어요.\n다음 화면에서 책을 빠르게 넣는 방법을 안내할게요.',
                ),
                _OnboardingPage(
                  icon: Icons.qr_code_scanner_rounded,
                  title: '바코드로 ISBN 등록',
                  body:
                      '책 뒷면의 ISBN 바코드를 카메라로 스캔하면 메타데이터를 불러와 등록 폼을 채워 줍니다.\n처음 스캔 시 카메라 권한을 허용해 주세요.',
                ),
                _OnboardingPage(
                  icon: Icons.edit_note_rounded,
                  title: '직접 입력·검색도 가능해요',
                  body:
                      '등록 화면에서 ISBN을 직접 입력하거나, 제목·키워드 검색으로 책을 찾을 수 있습니다.\n종이책 위주로 서가를 관리해 보세요.',
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
            child: FilledButton(
              onPressed: _submitting ? null : _next,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: scheme.primary,
                foregroundColor: scheme.onPrimary,
              ),
              child: _submitting
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : Text(
                      _page < _totalPages - 1
                          ? '다음'
                          : (widget.reviewOnly ? '닫기' : '시작하기'),
                      style: GoogleFonts.manrope(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                          letterSpacing: 0.3),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  const _OnboardingPage({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(28, 24, 28, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: BookfolioDesignTokens.surfaceContainerLow,
              borderRadius:
                  BorderRadius.circular(BookfolioDesignTokens.radiusSm),
              border:
                  Border.all(color: BookfolioDesignTokens.ghostOutline(0.12)),
            ),
            child: Icon(icon, size: 40, color: BookfolioDesignTokens.primary),
          ),
          const SizedBox(height: 28),
          Text(
            title,
            style: BookfolioDesignTokens.headlineMd(
                    BookfolioDesignTokens.primary,
                    fontStyle: FontStyle.normal)
                .copyWith(fontSize: 26, height: 1.2),
          ),
          const SizedBox(height: 16),
          Text(
            body,
            style: GoogleFonts.manrope(
              fontSize: 15,
              height: 1.5,
              color: BookfolioDesignTokens.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
