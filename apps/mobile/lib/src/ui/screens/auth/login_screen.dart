import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/screens/legal/legal_markdown_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

/// 소셜 로그인 전용 랜딩형 로그인 화면.
///
/// History:
/// - 2026-04-25: `Login.png` 기준으로 신규 생성(카카오/구글 전용, 중앙 정렬)
/// - 2026-04-25: 웹(`kIsWeb`)에서는 이메일/비밀번호 로그인 폼 노출, 소셜 버튼 숨김
/// - 2026-04-28: 플랫폼 분기 제거, 이메일/비밀번호 로그인 폼을 모든 환경에서 상시 노출
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submitEmailSignIn(AuthController auth) async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('이메일과 비밀번호를 입력해 주세요.')),
      );
      return;
    }
    await auth.signIn(email: email, password: password);
  }

  static const _kakaoAsset = 'assets/Kakao.svg';
  static const _googleSvgAsset = 'assets/Google.svg';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final screen = MediaQuery.sizeOf(context);
    final contentWidth = (screen.width - 40).clamp(280.0, 420.0);

    return Scaffold(
      backgroundColor: BookfolioDesignTokens.surface,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: SizedBox(
              width: contentWidth,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '서가담',
                    style: GoogleFonts.manrope(
                      fontSize: 58,
                      fontWeight: FontWeight.w800,
                      color: BookfolioDesignTokens.primary,
                      height: 1,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '서가에 책을 담다',
                    style: BookfolioDesignTokens.bodyLg(
                      BookfolioDesignTokens.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 22),
                  Image.asset(
                    'assets/brand/600_Login_Back.png',
                    width: 300,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    '로그인하고\n나만의 서가를 시작해보세요',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.manrope(
                      fontSize: 44 / 2,
                      height: 1.35,
                      fontWeight: FontWeight.w800,
                      color: BookfolioDesignTokens.primary,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    '읽은 책, 읽고 싶은 책, 인생책까지\n한곳에서 기록하고 정리해요.',
                    textAlign: TextAlign.center,
                    style: BookfolioDesignTokens.bodyLg(
                      BookfolioDesignTokens.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 22),
                  TextField(
                    controller: _emailController,
                    enabled: !auth.isLoading,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      hintText: '이메일',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _passwordController,
                    enabled: !auth.isLoading,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      hintText: '비밀번호',
                      border: const OutlineInputBorder(),
                      isDense: true,
                      suffixIcon: IconButton(
                        onPressed: auth.isLoading
                            ? null
                            : () => setState(
                                () => _obscurePassword = !_obscurePassword),
                        icon: Icon(_obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined),
                      ),
                    ),
                    onSubmitted: (_) => _submitEmailSignIn(auth),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: FilledButton(
                      onPressed: auth.isLoading
                          ? null
                          : () => _submitEmailSignIn(auth),
                      child: auth.isLoading
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('이메일로 로그인'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _SocialButton(
                    backgroundColor: const Color(0xFFFEE500),
                    label: '카카오로 시작하기',
                    loading: auth.isLoading,
                    onTap: auth.isLoading ? null : auth.signInWithKakao,
                    icon: Image.asset(
                      _kakaoAsset,
                      width: 20,
                      height: 20,
                      fit: BoxFit.contain,
                    ),
                    textColor: const Color(0xFF3A1D1D),
                  ),
                  const SizedBox(height: 12),
                  _SocialButton(
                    backgroundColor: Colors.white,
                    label: '구글로 시작하기',
                    loading: auth.isLoading,
                    onTap: auth.isLoading ? null : auth.signInWithGoogle,
                    icon: SvgPicture.asset(
                      _googleSvgAsset,
                      width: 20,
                      height: 20,
                    ),
                    textColor: BookfolioDesignTokens.onSurface,
                    border: Border.all(
                        color: BookfolioDesignTokens.outlineVariant
                            .withValues(alpha: 0.5)),
                  ),
                  const SizedBox(height: 14),
                  if (auth.error != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFEBEE),
                        borderRadius: BorderRadius.circular(
                            BookfolioDesignTokens.radiusMd),
                        border: Border.all(color: const Color(0xFFFFCDD2)),
                      ),
                      child: Text(
                        auth.error!,
                        style: GoogleFonts.manrope(
                          fontSize: 12,
                          color: const Color(0xFFB71C1C),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                  Text(
                    '로그인은 최초 1회만 필요해요.',
                    style: BookfolioDesignTokens.labelMd(
                      BookfolioDesignTokens.onSurfaceVariant,
                      opacity: 0.75,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 28),
                  Wrap(
                    alignment: WrapAlignment.center,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 2,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.of(context)
                            .push<void>(LegalMarkdownScreen.termsRoute()),
                        child: Text(
                          '이용약관',
                          style: BookfolioDesignTokens.labelMd(
                            BookfolioDesignTokens.onSurfaceVariant,
                            opacity: 0.9,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Text(
                        '·',
                        style: BookfolioDesignTokens.labelMd(
                          BookfolioDesignTokens.onSurfaceVariant,
                          opacity: 0.7,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      TextButton(
                        onPressed: () => Navigator.of(context)
                            .push<void>(LegalMarkdownScreen.privacyRoute()),
                        child: Text(
                          '개인정보처리방침',
                          style: BookfolioDesignTokens.labelMd(
                            BookfolioDesignTokens.onSurfaceVariant,
                            opacity: 0.9,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '탭하면 앱 내 페이지에서 바로 확인할 수 있어요.',
                    style: BookfolioDesignTokens.labelMd(
                      BookfolioDesignTokens.onSurfaceVariant,
                      opacity: 0.65,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Social login button used on the login screen.
///
/// @history
/// - 2026-04-28: 아이콘 렌더 폭 변동으로 인한 재발 overflow를 막기 위해 아이콘 영역을 고정 크기로 제한.
/// - 2026-04-28: Row overflow를 방지하기 위해 라벨 텍스트를 Flexible + ellipsis로 제한.
class _SocialButton extends StatelessWidget {
  const _SocialButton({
    required this.backgroundColor,
    required this.label,
    required this.loading,
    required this.onTap,
    required this.icon,
    required this.textColor,
    this.border,
  });

  final Color backgroundColor;
  final String label;
  final bool loading;
  final VoidCallback? onTap;
  final Widget icon;
  final Color textColor;
  final BoxBorder? border;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: Material(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: border,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (loading)
                    const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  else
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: FittedBox(
                        fit: BoxFit.contain,
                        child: icon,
                      ),
                    ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      softWrap: false,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.manrope(
                        fontSize: 28 / 2,
                        fontWeight: FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
