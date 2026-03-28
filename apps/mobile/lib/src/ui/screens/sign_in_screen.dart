import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

/// 이메일·비밀번호·Google 로그인(및 회원가입 전환).
///
/// History:
/// - 2026-03-28: 그라데이션·로고·카드 폼·Google 브랜딩 등 UI 정돈
class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  bool _isSignIn = true;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  static const _googleBlue = Color(0xFF4285F4);

  Future<void> _submit(AuthController auth) async {
    FocusScope.of(context).unfocus();
    if (_isSignIn) {
      await auth.signIn(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );
    } else {
      await auth.signUp(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final gradientColors = <Color>[
      colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
      colorScheme.primaryContainer.withValues(alpha: 0.25),
      theme.scaffoldBackgroundColor,
    ];

    return Scaffold(
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: gradientColors,
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 8),
                Center(
                  child: SvgPicture.asset(
                    'assets/brand/bookfolio_logo.svg',
                    height: 56,
                    width: 56,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Bookfolio',
                  textAlign: TextAlign.center,
                  style: textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '개인 서재를 기록하는 가장 가벼운 시작',
                  textAlign: TextAlign.center,
                  style: textTheme.bodyLarge?.copyWith(
                    height: 1.35,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 28),
                Container(
                  decoration: BoxDecoration(
                    color: colorScheme.surface.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: colorScheme.outlineVariant.withValues(alpha: 0.55),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: colorScheme.shadow.withValues(alpha: 0.08),
                        blurRadius: 24,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.fromLTRB(22, 24, 22, 22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _isSignIn ? '로그인' : '회원 가입',
                        style: textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _isSignIn
                            ? '이메일과 비밀번호로 계속하세요.'
                            : '이메일을 입력하고 비밀번호를 정하세요.',
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 20),
                      TextField(
                        controller: _emailController,
                        focusNode: _emailFocus,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.email],
                        onSubmitted: (_) => _passwordFocus.requestFocus(),
                        decoration: InputDecoration(
                          labelText: '이메일',
                          hintText: 'you@example.com',
                          prefixIcon: Icon(
                            Icons.alternate_email_rounded,
                            color: colorScheme.primary.withValues(alpha: 0.85),
                          ),
                          filled: true,
                          fillColor: colorScheme.surfaceContainerHighest
                              .withValues(alpha: 0.45),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide(
                              color: colorScheme.outline.withValues(alpha: 0.35),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide(
                              color: colorScheme.primary,
                              width: 1.5,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: _passwordController,
                        focusNode: _passwordFocus,
                        obscureText: _obscurePassword,
                        textInputAction: TextInputAction.done,
                        autofillHints: _isSignIn
                            ? const [AutofillHints.password]
                            : const [AutofillHints.newPassword],
                        onSubmitted: (_) => _submit(auth),
                        decoration: InputDecoration(
                          labelText: '비밀번호',
                          prefixIcon: Icon(
                            Icons.lock_outline_rounded,
                            color: colorScheme.primary.withValues(alpha: 0.85),
                          ),
                          suffixIcon: IconButton(
                            onPressed: () => setState(
                              () => _obscurePassword = !_obscurePassword,
                            ),
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              color: colorScheme.onSurfaceVariant,
                            ),
                            tooltip: _obscurePassword ? '비밀번호 표시' : '비밀번호 숨기기',
                          ),
                          filled: true,
                          fillColor: colorScheme.surfaceContainerHighest
                              .withValues(alpha: 0.45),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide(
                              color: colorScheme.outline.withValues(alpha: 0.35),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide(
                              color: colorScheme.primary,
                              width: 1.5,
                            ),
                          ),
                        ),
                      ),
                      if (auth.error != null) ...[
                        const SizedBox(height: 14),
                        Material(
                          color: colorScheme.errorContainer
                              .withValues(alpha: 0.88),
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 12,
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  Icons.error_outline_rounded,
                                  size: 20,
                                  color: colorScheme.onErrorContainer,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    auth.error!,
                                    style: textTheme.bodySmall?.copyWith(
                                      color: colorScheme.onErrorContainer,
                                      height: 1.35,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: auth.isLoading ? null : () => _submit(auth),
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 0,
                        ),
                        child: auth.isLoading
                            ? SizedBox(
                                height: 22,
                                width: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: colorScheme.onPrimary,
                                ),
                              )
                            : Text(
                                _isSignIn ? '로그인' : '가입하기',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 16,
                                ),
                              ),
                      ),
                      if (_isSignIn) ...[
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            Expanded(
                              child: Divider(
                                color: colorScheme.outlineVariant
                                    .withValues(alpha: 0.7),
                              ),
                            ),
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 12),
                              child: Text(
                                '또는',
                                style: textTheme.labelMedium?.copyWith(
                                  color: colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ),
                            Expanded(
                              child: Divider(
                                color: colorScheme.outlineVariant
                                    .withValues(alpha: 0.7),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        OutlinedButton(
                          onPressed:
                              auth.isLoading ? null : auth.signInWithGoogle,
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(52),
                            side: BorderSide(
                              color: colorScheme.outline.withValues(alpha: 0.65),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            backgroundColor: colorScheme.surface.withValues(
                              alpha: 0.6,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'G',
                                style: textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: _googleBlue,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'Google로 계속하기',
                                style: textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Center(
                        child: TextButton(
                          onPressed: auth.isLoading
                              ? null
                              : () {
                                  context.read<AuthController>().clearError();
                                  setState(() => _isSignIn = !_isSignIn);
                                },
                          child: Text(
                            _isSignIn ? '계정이 없으신가요? 가입하기' : '이미 계정이 있어요 · 로그인',
                            style: textTheme.labelLarge?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
